
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scryptSync, randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'diagnostic.db');
const db = new Database(dbPath);

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

const email = 'admin.lannion@images-et-reseaux.com';
const password = 'Admin2026!';
const firstName = 'Admin';
const lastName = 'Lannion';

try {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const result = db.prepare(`
    INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, passwordHash, salt, firstName, lastName, 'Administrateur Plateforme');

  const consultantId = result.lastInsertRowid;

  // Assign both roles
  db.prepare(`
    INSERT INTO user_roles (consultant_id, role)
    VALUES (?, 'admin')
  `).run(consultantId);

  db.prepare(`
    INSERT INTO user_roles (consultant_id, role)
    VALUES (?, 'consultant')
  `).run(consultantId);

  console.log(`✅ Compte administrateur créé avec succès !`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    console.log(`⚠️ L'email ${email} existe déjà.`);
  } else {
    console.error('Erreur lors de la création du compte:', error);
  }
} finally {
  db.close();
}
