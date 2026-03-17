#!/bin/bash
# Script de réparation et d'importation complète des données - IR_DIAG_IA

CURRENT_DB="c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db"
OLD_DB="c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/YARTIS/PROJETS/IR/IR_DIAG_IA/data/diagnostic.db"

echo "===================================================="
echo "⚡ RÉPARATION ET IMPORTATION COMPLÈTE"
echo "===================================================="

node -e "
const Database = require('better-sqlite3');
const currentDb = new Database('$CURRENT_DB');
const oldDb = new Database('$OLD_DB');

try {
    const oldMissions = oldDb.prepare('SELECT * FROM missions').all();
    
    for (const m of oldMissions) {
        // 1. Identifier la mission dans la nouvelle base
        const newM = currentDb.prepare('SELECT id FROM missions WHERE organization_name = ? AND created_at = ?').get(m.organization_name, m.created_at);
        if (!newM) {
            console.log('Skipping missing mission: ' + m.organization_name);
            continue;
        }
        const newMissionId = newM.id;
        console.log('--- Mission : ' + m.organization_name + ' (New ID: ' + newMissionId + ') ---');

        // 2. Réparer les liens des services (remplacer l'ancien ID par le nouveau dans l'URL)
        const services = currentDb.prepare('SELECT id, code, unique_link FROM mission_services WHERE mission_id = ?').all(newMissionId);
        for (const s of services) {
            const oldLink = s.unique_link;
            const newLink = oldLink.replace(/\/questionnaire\/(full|flash)\/\d+/, '/questionnaire/\$1/' + newMissionId);
            if (oldLink !== newLink) {
                currentDb.prepare('UPDATE mission_services SET unique_link = ? WHERE id = ?').run(newLink, s.id);
                console.log('  ✅ Lien mis à jour pour service : ' + s.code);
            }
        }

        // 3. Réparer le mapping Contact <-> Service
        // On se base sur le code du service pour retrouver le lien
        const oldServices = oldDb.prepare('SELECT id, code FROM mission_services WHERE mission_id = ?').all(m.id);
        const newServices = currentDb.prepare('SELECT id, code FROM mission_services WHERE mission_id = ?').all(newMissionId);
        
        const oldServiceIdToCode = {};
        oldServices.forEach(s => oldServiceIdToCode[s.id] = s.code);
        
        const codeToNewServiceId = {};
        newServices.forEach(s => codeToNewServiceId[s.code] = s.id);

        const oldContacts = oldDb.prepare('SELECT id, first_name, last_name, service_id FROM mission_contacts WHERE mission_id = ?').all(m.id);
        for (const oc of oldContacts) {
            if (oc.service_id) {
                const sCode = oldServiceIdToCode[oc.service_id];
                const newSid = codeToNewServiceId[sCode];
                if (newSid) {
                    currentDb.prepare('UPDATE mission_contacts SET service_id = ? WHERE mission_id = ? AND first_name = ? AND last_name = ?').run(
                        newSid, newMissionId, oc.first_name, oc.last_name
                    );
                    // console.log('  ✅ Contact rattaché au service : ' + oc.first_name + ' -> ' + sCode);
                }
            }
        }

        // 4. Importation des Sessions et Réponses
        const oldSessions = oldDb.prepare('SELECT * FROM sessions WHERE mission_id = ?').all(m.id);
        console.log('  📥 Importation de ' + oldSessions.length + ' sessions...');

        for (const os of oldSessions) {
            // Identifier le nouveau service_id pour la session
            let newSidForSession = null;
            if (os.service_id) {
                const sCode = oldServiceIdToCode[os.service_id];
                newSidForSession = codeToNewServiceId[sCode];
            }

            // Vérifier si la session existe (par son token unique)
            const sessionExists = currentDb.prepare('SELECT id FROM sessions WHERE anonymous_token = ?').get(os.anonymous_token);
            let currentSessionId;
            
            if (!sessionExists) {
                const res = currentDb.prepare('INSERT INTO sessions (mission_id, service_id, anonymous_token, started_at, completed_at, is_anonymous, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                    newMissionId, newSidForSession, os.anonymous_token, os.started_at, os.completed_at, os.is_anonymous || 0, os.contact_id || null
                );
                currentSessionId = res.lastInsertRowid;
            } else {
                currentSessionId = sessionExists.id;
            }

            // Importation des réponses pour cette session
            const oldResponses = oldDb.prepare('SELECT * FROM responses WHERE session_id = ?').all(os.id);
            for (const or of oldResponses) {
                const respExists = currentDb.prepare('SELECT id FROM responses WHERE session_id = ? AND question_id = ?').get(currentSessionId, or.question_id);
                if (!respExists) {
                    currentDb.prepare('INSERT INTO responses (session_id, question_id, dimension, answer_value, created_at) VALUES (?, ?, ?, ?, ?)').run(
                        currentSessionId, or.question_id, or.dimension, or.answer_value, or.created_at
                    );
                }
            }
        }
    }

    console.log('\n✅ Réparation et Import terminés avec succès !');
} catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error(error.stack);
} finally {
    currentDb.close();
    oldDb.close();
}
"
