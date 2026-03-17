#!/bin/bash

# Chemins des bases de données
CURRENT_DB="c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db"
OLD_DB="c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/YARTIS/PROJETS/IR/IR_DIAG_IA/data/diagnostic.db"

echo "📂 Analyse des bases de données..."

if [ ! -f "$OLD_DB" ]; then
    echo "❌ Erreur : La base de données source (YARTIS) est introuvable."
    exit 1
fi

echo "🔄 Lancement de l'importation des missions depuis : $OLD_DB"

# Utilisation de Node car sqlite3 n'est pas dans le PATH
node -e "
const Database = require('better-sqlite3');
const currentDb = new Database('$CURRENT_DB');
const oldDb = new Database('$OLD_DB');

try {
    console.log('--- Phase 1 : Importation des Consultants manquants ---');
    const oldConsultants = oldDb.prepare('SELECT * FROM consultants').all();
    
    for (const c of oldConsultants) {
        const exists = currentDb.prepare('SELECT id FROM consultants WHERE email = ?').get(c.email);
        if (!exists) {
            console.log('➕ Ajout du consultant : ' + c.email);
            currentDb.prepare('INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title, phone, signature_html, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                c.email, c.password_hash, c.salt, c.first_name, c.last_name, c.job_title, c.phone, c.signature_html, c.created_at
            );
        }
    }

    console.log('\n--- Phase 2 : Importation des Missions (YARTIS, AC3, etc.) ---');
    const oldMissions = oldDb.prepare('SELECT * FROM missions').all();
    
    for (const m of oldMissions) {
        // Obtenir l'email du consultant de la mission
        const consultant = oldDb.prepare('SELECT email FROM consultants WHERE id = ?').get(m.consultant_id);
        if (!consultant) continue;

        // Obtenir le nouvel ID du consultant dans la DB actuelle
        const newConsultant = currentDb.prepare('SELECT id FROM consultants WHERE email = ?').get(consultant.email);
        
        // Vérifier si la mission existe déjà
        const missionExists = currentDb.prepare('SELECT id FROM missions WHERE organization_name = ? AND created_at = ?').get(m.organization_name, m.created_at);
        
        if (!missionExists) {
            console.log('🚀 Importation de la mission : ' + m.organization_name);
            const result = currentDb.prepare('INSERT INTO missions (consultant_id, organization_name, sector, employees, questionnaire_type, status, closure_date, summary, maturity_percent, respondents_percent, satisfaction_stars, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                newConsultant.id, m.organization_name, m.sector, m.employees, m.questionnaire_type, m.status, m.closure_date, m.summary, m.maturity_percent, m.respondents_percent, m.satisfaction_stars, m.created_at
            );
            
            const newMissionId = result.lastInsertRowid;
            const oldMissionId = m.id;

            // Importation des Services liés
            const services = oldDb.prepare('SELECT * FROM mission_services WHERE mission_id = ?').all(oldMissionId);
            for (const s of services) {
                console.log('  └─ Service : ' + s.name);
                currentDb.prepare('INSERT INTO mission_services (mission_id, name, code, unique_link, created_at) VALUES (?, ?, ?, ?, ?)').run(
                    newMissionId, s.name, s.code, s.unique_link, s.created_at
                );
            }

            // Importation des Contacts liés
            const contacts = oldDb.prepare('SELECT * FROM mission_contacts WHERE mission_id = ?').all(oldMissionId);
            for (const ct of contacts) {
                console.log('  └─ Contact : ' + ct.first_name + ' ' + ct.last_name);
                currentDb.prepare('INSERT INTO mission_contacts (mission_id, first_name, last_name, role, email, phone, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
                    newMissionId, ct.first_name, ct.last_name, ct.role, ct.email, ct.phone, ct.is_primary, ct.created_at
                );
            }
        } else {
            console.log('ℹ️ Mission déjà présente : ' + m.organization_name);
        }
    }

    console.log('\n--- Phase 3 : Importation des Flash Diags ---');
    const oldFlash = oldDb.prepare('SELECT * FROM flash_diagnostics').all();
    for (const f of oldFlash) {
        const exists = currentDb.prepare('SELECT id FROM flash_diagnostics WHERE organization_name = ? AND created_at = ?').get(f.organization_name, f.created_at);
        if (!exists) {
            console.log('⚡ Importation Flash Diag : ' + f.organization_name);
            currentDb.prepare('INSERT INTO flash_diagnostics (organization_name, contact_name, contact_email, contact_phone, contact_role, employees, sector, postal_code, department, region, global_score, maturity_level, answers_json, dimension_scores_json, recommendations_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
                f.organization_name, f.contact_name, f.contact_email, f.contact_phone, f.contact_role, f.employees, f.sector, f.postal_code, f.department, f.region, f.global_score, f.maturity_level, f.answers_json, f.dimension_scores_json, f.recommendations_json, f.created_at
            );
        }
    }

    console.log('\n✅ Importation terminée avec succès !');
} catch (error) {
    console.error('❌ Erreur lors de l import :', error.message);
} finally {
    currentDb.close();
    oldDb.close();
}
"
