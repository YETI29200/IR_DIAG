const db = require('better-sqlite3')('./data/diagnostic.db');

try {
    const content = '<p>Cordialement,<br><strong>L\'équipe Images & Réseaux</strong><br><img src="https://www.images-et-reseaux.com/wp-content/uploads/2018/01/logo-header-1.png" alt="Logo Images et Réseaux" style="max-height: 50px; margin-top: 15px;"></p>';

    // Create table if it doesn't exist
    db.exec(`
    CREATE TABLE IF NOT EXISTS signature_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      html_content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    const existing = db.prepare('SELECT id FROM signature_templates WHERE is_default = 1').get();

    if (existing) {
        db.prepare('UPDATE signature_templates SET html_content = ? WHERE id = ?').run(content, existing.id);
    } else {
        db.prepare('INSERT INTO signature_templates (name, html_content, is_default) VALUES (?, ?, 1)').run('Images & Réseaux', content);
    }

    console.log('✅ Default signature template updated!');
} catch (e) {
    console.error('Error:', e);
}
