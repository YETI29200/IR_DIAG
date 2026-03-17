// Flash Diagnostic routes
import { getDb } from '../db/index.js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateRecommendationsWithParams, isOpenAIConfigured, normalizeDimensionKey } from '../utils/openai.js'
import { sendEmailWithExchange, isExchangeConfigured } from '../utils/exchange.js'
import { isAdmin, isConsultant } from '../utils/roles.js'
import { spawn } from 'child_process'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FLASH_QUESTIONNAIRE_FILE = join(__dirname, '../../data/questionnaire_flash_v1.json')
const CONTACT_FORM_FILE = join(__dirname, '../../data/formulaire_de_contact.json')

export default async function flashRoutes(req, res, url, body) {
    const db = getDb()

    // GET /api/flash/config
    if (req.method === 'GET' && url.pathname === '/api/flash/config') {
        try {
            const questionnaire = JSON.parse(readFileSync(FLASH_QUESTIONNAIRE_FILE, 'utf-8'))
            const contactForm = JSON.parse(readFileSync(CONTACT_FORM_FILE, 'utf-8'))

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ questionnaire, contactForm }))
        } catch (error) {
            console.error('[Flash] Error loading config:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
        }
        return
    }

    // POST /api/flash/submit
    if (req.method === 'POST' && url.pathname === '/api/flash/submit') {
        const { answers, contactInfo } = body || {}

        if (!answers || !contactInfo) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'answers and contactInfo are required' }))
            return
        }

        try {
            // 1. Calculate Scores
            const questionnaire = JSON.parse(readFileSync(FLASH_QUESTIONNAIRE_FILE, 'utf-8'))
            const dimensionScores = calculateFlashScores(answers, questionnaire)

            const globalScore = Math.round(
                dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length
            )

            let maturityLevel = 'Débutant'
            if (globalScore >= 75) maturityLevel = 'Expert'
            else if (globalScore >= 50) maturityLevel = 'Avancé'
            else if (globalScore >= 25) maturityLevel = 'Initié'

            // 2. Map Postal Code to Region/Dept
            const postalCode = contactInfo.code_postal || ''
            const { department, region } = getRegionInfo(postalCode)

            // 3. Generate Recommendations via AI
            let recommendations = []
            if (isOpenAIConfigured()) {
                try {
                    recommendations = await generateRecommendationsWithParams(
                        dimensionScores.map(d => ({
                            dimension: d.id,
                            score: d.score,
                            level: d.score >= 70 ? 'high' : d.score >= 40 ? 'medium' : 'low'
                        })),
                        'flash',
                        contactInfo.nom_de_l_entreprise || 'Entreprise Flash',
                        {
                            tone: 'professional',
                            detailLevel: 'balanced',
                            language: 'fr'
                        }
                    )
                } catch (aiError) {
                    console.error('[Flash] AI Generation failed, using static fallback:', aiError)
                    recommendations = generateStaticRecommendations(dimensionScores)
                }
            } else {
                recommendations = generateStaticRecommendations(dimensionScores)
            }

            // 4. Format Report
            const report = formatFlashReport(contactInfo, globalScore, maturityLevel, dimensionScores, recommendations)

            // 5. Save to database
            try {
                db.prepare(`
                    INSERT INTO flash_diagnostics (
                        organization_name, contact_name, contact_email, contact_phone, contact_role,
                        employees, sector, postal_code, department, region,
                        global_score, maturity_level, answers_json, dimension_scores_json, recommendations_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    contactInfo.nom_de_l_entreprise || 'N/A',
                    contactInfo.nom_du_participant || 'N/A',
                    contactInfo.email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad || 'N/A',
                    contactInfo.telephone || null,
                    contactInfo.role_du_participant || null,
                    contactInfo.taille_de_l_entreprise || null,
                    contactInfo.secteur_d_activite || null,
                    postalCode,
                    department,
                    region,
                    globalScore,
                    maturityLevel,
                    JSON.stringify(answers),
                    JSON.stringify(dimensionScores),
                    JSON.stringify(recommendations)
                )
                
                // Trigger WAL checkpoint to ensure data is committed to the main file
                // and visible in external history tools/backups
                db.pragma('wal_checkpoint(FULL)');
                console.log('[Flash] Database checkpoint performed after submission');
            } catch (dbError) {
                console.error('[Flash] Failed to save to flash_diagnostics:', dbError)
            }

            // 6. Send Email
            if (isExchangeConfigured()) {
                const email = contactInfo.email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad
                if (email) {
                    try {
                        await sendEmailWithExchange(
                            email,
                            `Votre Rapport Diagnostic IA - ${contactInfo.nom_de_l_entreprise}`,
                            report.html
                        )
                        console.log(`[Flash] Report sent to ${email}`)

                        // Send a copy to administrator
                        try {
                            await sendEmailWithExchange(
                                'ydeniaux@images-et-reseaux.com',
                                `[FLASH DIAG] Nouveau diagnostic : ${contactInfo.nom_de_l_entreprise}`,
                                report.html
                            )
                        } catch (adminEmailError) {
                            console.error('[Flash] Admin email copy failed:', adminEmailError)
                        }
                    } catch (emailError) {
                        console.error('[Flash] Email sending failed:', emailError)
                    }
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                success: true,
                globalScore,
                maturityLevel,
                dimensionScores,
                recommendations
            }))
        } catch (error) {
            console.error('[Flash] Submission error:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error', message: error.message }))
        }
        return
    }

    // GET /api/flash/history - Admin only
    if (req.method === 'GET' && url.pathname === '/api/flash/history') {
        const consultantId = url.searchParams.get('consultantId')
        console.log(`[Flash] History request from consultantId: ${consultantId}`)
        if (!consultantId || (!isAdmin(parseInt(consultantId)) && !isConsultant(parseInt(consultantId)))) {
            console.warn(`[Flash] History access denied for consultantId: ${consultantId}`)
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
        }

        try {
            console.log(`[Flash] Fetching history...`)
            const history = db.prepare(`
                SELECT id, organization_name, contact_name, contact_email, 
                       department, region, global_score, maturity_level, created_at
                FROM flash_diagnostics
                ORDER BY created_at DESC
            `).all()
            console.log(`[Flash] Found ${history.length} entries`)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(history))
        } catch (error) {
            console.error('[Flash] History error:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
        }
        return
    }

    // POST /api/flash/generate-pdf
    if (req.method === 'POST' && url.pathname === '/api/flash/generate-pdf') {
        const bodyData = body || {}
        const { id, consultantId } = bodyData
        if (!consultantId || (!isAdmin(parseInt(consultantId)) && !isConsultant(parseInt(consultantId)))) {
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
        }

        try {
            const diag = db.prepare('SELECT * FROM flash_diagnostics WHERE id = ?').get(id)
            if (!diag) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Diagnostic not found' }))
                return
            }

            const dimensionScores = JSON.parse(diag.dimension_scores_json)
            const recommendations = JSON.parse(diag.recommendations_json)
            const flashContact = {
                nom_de_l_entreprise: diag.organization_name,
                nom_du_participant: diag.contact_name,
                role_du_participant: diag.contact_role,
                secteur_d_activite: diag.sector,
                code_postal: diag.postal_code,
                email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad: diag.contact_email,
                telephone: diag.contact_phone
            }

            const report = formatFlashReport(flashContact, diag.global_score, diag.maturity_level, dimensionScores, recommendations)

            // Use Python generator for optimized PDF
            const pythonScriptPath = join(__dirname, '..', 'utils', 'pdf_generator.py')
            const outputPath = join(__dirname, '..', '..', `temp_flash_${id}.pdf`)

            console.log(`[Flash PDF] Starting generation for ID: ${id}`)
            // Pre-match recommendations to dimension order for Python (which uses index-based matching)
            const orderedRecs = dimensionScores.map(d => {
                const normalizedId = normalizeDimensionKey(d.id)
                return recommendations.find(r =>
                    r.dimension === d.id ||
                    r.dimension === normalizedId ||
                    normalizeDimensionKey(r.dimension) === normalizedId
                ) || { title: '', description: '', actions: [] }
            })
            const inputData = JSON.stringify({
                scores: dimensionScores.map(d => d.score),
                labels: dimensionScores.map(d => d.label),
                recommendations_data: orderedRecs,
                organization: diag.organization_name,
                contact_info: flashContact
            })

            console.log(`[Flash PDF] Spawning python process...`)
            const pyProcess = spawn('python', [pythonScriptPath, '--json', inputData, '--out', outputPath])
            let pyOutput = ''
            let pyError = ''
            pyProcess.stdout.on('data', (data) => { pyOutput += data.toString() })
            pyProcess.stderr.on('data', (data) => { pyError += data.toString() })

            pyProcess.on('close', (code) => {
                console.log(`[Flash PDF] Process closed with code: ${code}`)
                if (code === 0 && pyOutput.includes('SUCCESS:')) {
                    const pdfPath = pyOutput.split('SUCCESS:')[1].trim()
                    console.log(`[Flash PDF] Success. Path: ${pdfPath}`)

                    if (fs.existsSync(pdfPath)) {
                        const stat = fs.statSync(pdfPath)
                        res.writeHead(200, {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `attachment; filename="Diagnostic_Flash_${diag.organization_name.replace(/\s+/g, '_')}.pdf"`,
                            'Content-Length': stat.size
                        })
                        const readStream = fs.createReadStream(pdfPath)
                        readStream.pipe(res)
                        readStream.on('end', () => {
                            try { fs.unlinkSync(pdfPath) } catch (e) { }
                        })
                    } else {
                        console.error(`[Flash PDF] File not found: ${pdfPath}`)
                        res.writeHead(500, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: 'Generated PDF file not found' }))
                    }
                } else {
                    console.error(`[Flash PDF] Failed. Code: ${code}, Error: ${pyError}, Output: ${pyOutput}`)
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ error: 'Python script failed', details: pyOutput || pyError }))
                }
            })
        } catch (error) {
            console.error('[Flash] PDF error:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
        }
        return
    }

    // DELETE /api/flash/:id (delete a flash diagnostic)
    if (req.method === 'DELETE' && url.pathname.match(/^\/api\/flash\/\d+$/)) {
        const consultantId = url.searchParams.get('consultantId')
        const parts = url.pathname.split('/')
        const id = parseInt(parts[3])

        if (!consultantId || !isAdmin(parseInt(consultantId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
        }

        try {
            const result = db.prepare('DELETE FROM flash_diagnostics WHERE id = ?').run(id)
            if (result.changes === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Diagnostic not found' }))
                return
            }

            db.pragma('wal_checkpoint(FULL)');
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true, message: 'Diagnostic supprimé' }))
        } catch (error) {
            console.error('[Flash] Delete error:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
        }
        return
    }
}

function getRegionInfo(postalCode) {
    if (!postalCode || postalCode.length < 2) return { department: 'Inconnu', region: 'Inconnu' }
    const deptPrefix = postalCode.substring(0, 2)

    const mapping = {
        '22': { department: "Côtes-d'Armor", region: 'Bretagne' },
        '29': { department: 'Finistère', region: 'Bretagne' },
        '35': { department: 'Ille-et-Vilaine', region: 'Bretagne' },
        '56': { department: 'Morbihan', region: 'Bretagne' },
        '44': { department: 'Loire-Atlantique', region: 'Pays de la Loire' },
        '49': { department: 'Maine-et-Loire', region: 'Pays de la Loire' },
        '53': { department: 'Mayenne', region: 'Pays de la Loire' },
        '72': { department: 'Sarthe', region: 'Pays de la Loire' },
        '85': { department: 'Vendée', region: 'Pays de la Loire' }
    }

    return mapping[deptPrefix] || { department: `Dép. ${deptPrefix}`, region: 'Autre' }
}

function calculateFlashScores(answers, questionnaire) {
    const scores = []

    questionnaire.sections.forEach(section => {
        let sectionTotal = 0
        let questionCount = 0

        section.questions.forEach(q => {
            const answer = answers[q.id]
            if (answer !== undefined) {
                if (answer === 'oui') sectionTotal += 100
                else if (answer === 'non') sectionTotal += 0
                else {
                    const options = q.options || []
                    const index = options.findIndex(o => o.value === answer)
                    if (index !== -1 && options.length > 1) {
                        sectionTotal += (index / (options.length - 1)) * 100
                    }
                }
                questionCount++
            }
        })

        scores.push({
            id: section.id,
            label: section.label,
            score: questionCount > 0 ? Math.round(sectionTotal / questionCount) : 0
        })
    })

    return scores
}

function generateStaticRecommendations(dimensionScores) {
    return dimensionScores.map(d => {
        let title = ''
        let description = ''
        let actions = []

        if (d.id === 'usages_de_lia') {
            if (d.score < 40) {
                title = "Initier l'exploration des cas d'usage"
                description = "Votre organisation est au début de son parcours IA. Il est crucial d'identifier des opportunités concrètes."
                actions = ["Réaliser une session de brainstorming sur les points de douleur", "Identifier une tâche simple à automatiser", "Veille technologique sur les outils IA de votre secteur"]
            } else if (d.score < 70) {
                title = "Structurer l'application de l'IA"
                description = "Vous avez déjà quelques usages. L'étape suivante est de systématiser l'approche."
                actions = ["Prioriser les cas d'usage par ROI", "Lancer un projet pilote structuré", "Mesurer les gains de productivité actuels"]
            } else {
                title = "Optimiser et innover continuellement"
                description = "Votre usage de l'IA est mature. Focus sur l'innovation de pointe."
                actions = ["Explorer l'IA générative personnalisée", "Optimiser les modèles existants", "Partager les succès en interne pour inspirer d'autres services"]
            }
        } else if (d.id === 'data') {
            if (d.score < 40) {
                title = "Poser les bases de la gestion de données"
                description = "Sans données structurées, l'IA ne peut fonctionner. Il faut centraliser vos ressources."
                actions = ["Inventorier les sources de données", "Nettoyer les bases de données critiques", "Mettre en place une politique de collecte simple"]
            } else if (d.score < 70) {
                title = "Améliorer la qualité et l'accessibilité"
                description = "Vos données existent mais leur exploitation peut être optimisée."
                actions = ["Mettre en place un pipeline automatique", "Améliorer la documentation des données", "Tester des outils de visualisation (BI)"]
            } else {
                title = "Gouvernance et exploitation avancée"
                description = "Vos données sont un actif stratégique majeur et bien géré."
                actions = ["Mettre en place une gouvernance de données stricte", "Explorer le temps réel", "Ouvrir des APIs internes sécurisées"]
            }
        } else if (d.id === 'competences_culture') {
            if (d.score < 40) {
                title = "Sensibiliser et acculturer les équipes"
                description = "L'IA commence par la compréhension humaine. La peur du changement doit être levée."
                actions = ["Organiser une conférence d'introduction à l'IA", "Identifier des 'champions' internes curieux", "Partager des exemples de réussite simples"]
            } else if (d.score < 70) {
                title = "Développer les compétences techniques"
                description = "Il est temps de monter en compétence sur la mise en œuvre."
                actions = ["Proposer des formations spécifiques aux outils", "Recruter ou former un référent IA", "Mettre en place des ateliers pratiques"]
            } else {
                title = "Inscrire l'IA dans l'ADN de l'entreprise"
                description = "Votre culture favorise l'innovation constante via l'IA."
                actions = ["Encourager l'expérimentation libre", "Mettre en place une veille collaborative", "Récompenser les initiatives innovantes"]
            }
        } else if (d.id === 'infrastructure') {
            if (d.score < 40) {
                title = "Évaluer les besoins infrastructurels"
                description = "L'IA nécessite une puissance de calcul et une sécurité adaptées."
                actions = ["Auditer l'infrastructure actuelle", "Considérer le passage au Cloud", "Vérifier la conformité RGPD de base"]
            } else if (d.score < 70) {
                title = "Moderniser les outils et la sécurité"
                description = "Votre infrastructure supporte l'IA mais doit gagner en agilité."
                actions = ["Adopter des outils de collaboration Cloud", "Renforcer la cybersécurité", "Mettre en place des environnements de test"]
            } else {
                title = "Scalabilité et automatisation (DevOps/MLOps)"
                description = "Votre infrastructure est robuste, sécurisée et prête pour l'échelle."
                actions = ["Automatiser les déploiements", "Optimiser les coûts Cloud", "Mettre en place un monitoring temps réel"]
            }
        } else if (d.id === 'strategie_vision') {
            if (d.score < 40) {
                title = "Définir une vision stratégique IA"
                description = "L'IA ne doit pas être un gadget mais un levier de croissance."
                actions = ["Inclure l'IA dans la stratégie annuelle", "Allouer un premier budget d'exploration", "Définir des objectifs à 12 mois"]
            } else if (d.score < 70) {
                title = "Aligner l'IA sur le business"
                description = "Votre stratégie est claire, il faut maintenant l'exécuter."
                actions = ["Établir une feuille de route détaillée", "Mesurer le ROI des projets IA", "Communiquer la vision aux actionnaires/équipes"]
            } else {
                title = "Leadership et vision long terme"
                description = "L'IA est au cœur de votre avantage compétitif."
                actions = ["Anticiper les ruptures technologiques", "Investir dans la R&D IA", "Évangéliser votre secteur d'activité"]
            }
        } else {
            title = `Renforcer la dimension ${d.label}`
            description = `Des efforts sont nécessaires pour renforcer votre maturité en ${d.label}.`
            actions = ["Établir un plan d'action dédié", "Consulter un expert Images & Réseaux"]
        }

        return {
            dimension: d.id,
            title,
            description,
            actions
        }
    })
}

function formatFlashReport(contactInfo, globalScore, maturityLevel, dimensionScores, recommendations) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
      <h1 style="color: #00B1E6;">Rapport Diagnostic IA & Data - Flash</h1>
      
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Informations de l'entreprise</h2>
        <table style="width: 100%;">
          <tr><td><strong>Nom :</strong></td><td>${contactInfo.nom_de_l_entreprise}</td></tr>
          <tr><td><strong>Participant :</strong></td><td>${contactInfo.nom_du_participant} (${contactInfo.role_du_participant})</td></tr>
          <tr><td><strong>Secteur :</strong></td><td>${contactInfo.secteur_d_activite || 'N/A'}</td></tr>
          <tr><td><strong>Code Postal :</strong></td><td>${contactInfo.code_postal}</td></tr>
          <tr><td><strong>Email :</strong></td><td>${contactInfo.email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad}</td></tr>
          ${contactInfo.telephone ? `<tr><td><strong>Téléphone :</strong></td><td>${contactInfo.telephone}</td></tr>` : ''}
        </table>
      </div>

      <div style="text-align: center; padding: 30px; background: #E6F4FE; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Score Global</h2>
        <div style="font-size: 48px; font-weight: bold; color: #00B1E6;">${globalScore} / 100</div>
        <div style="font-size: 24px; color: #666;">Maturité : ${maturityLevel}</div>
      </div>

      <h2>Résultats par dimension et Recommandations</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #00B1E6; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Dimension</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Recommandations et Actions</th>
          </tr>
        </thead>
        <tbody>
          ${dimensionScores.map(d => {
        // Match by normalized key: questionnaire uses 'usages_de_lia' but AI returns 'cas_usage'
        const normalizedId = normalizeDimensionKey(d.id)
        const rec = recommendations.find(r => r.dimension === d.id || r.dimension === normalizedId || normalizeDimensionKey(r.dimension) === normalizedId) || { title: 'N/A', description: 'N/A', actions: [] }
        return `
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;"><strong>${d.label}</strong></td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${d.score}/100</td>
                <td style="padding: 12px; border: 1px solid #ddd;">
                  <div style="font-weight: bold; margin-bottom: 5px;">${rec.title}</div>
                  <div style="font-size: 0.9em; margin-bottom: 10px;">${rec.description || rec.synthesis || ''}</div>
                  ${rec.actions && rec.actions.length > 0 ? `
                    <ul style="margin: 0; padding-left: 20px; font-size: 0.85em;">
                      ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                  ` : ''}
                </td>
              </tr>
            `
    }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; padding: 20px; border-top: 2px solid #00B1E6; font-size: 0.8em; color: #777;">
        Ce rapport a été généré automatiquement par la plateforme de Diagnostic IA & Data de Images & Réseaux / EDIH Bretagne et Pays de la Loire.
      </div>
    </div>
  `

    return { html }
}
