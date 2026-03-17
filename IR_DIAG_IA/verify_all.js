import Database from 'better-sqlite3';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = 'c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db';
const BACKUP_DIR = 'c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/backups';

console.log('--- VÉRIFICATION GLOBALE ---');

if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
    const db = new Database(DB_PATH);
    
    // 1. WAL Checkpoint
    console.log('📦 1. Exécution du WAL Checkpoint...');
    db.pragma('wal_checkpoint(FULL)');
    
    // 2. Integrity Check
    console.log('🔍 2. Vérification de l\'intégrité...');
    const integrity = db.prepare('PRAGMA integrity_check').get()['integrity_check'];
    console.log(`   Résultat : ${integrity === 'ok' ? '✅ SAINE' : '❌ ERREUR : ' + integrity}`);
    
    // 3. Stats rapides
    const missions = db.prepare('SELECT COUNT(*) as c FROM missions').get().c;
    const flash = db.prepare('SELECT COUNT(*) as c FROM flash_diagnostics').get().c;
    const sessions = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;
    console.log(`📊 3. Statistiques : ${missions} Missions, ${flash} Flash Diags, ${sessions} Sessions.`);

    db.close();

    // 4. Backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = join(BACKUP_DIR, `diagnostic_verify_${timestamp}.db`);
    copyFileSync(DB_PATH, backupPath);
    console.log(`💾 4. Sauvegarde créée : ${backupPath}`);

    console.log('\n✨ TOUT EST PRÊT ET VÉRIFIÉ.');
} catch (e) {
    console.error('❌ Erreur lors de la vérification :', e.message);
}
