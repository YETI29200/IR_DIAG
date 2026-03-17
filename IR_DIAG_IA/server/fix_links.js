import Database from 'better-sqlite3';

const db = new Database('./data/diagnostic.db');

const services = db.prepare(`SELECT id, unique_link FROM mission_services`).all();
let fixed = 0;

for (const s of services) {
    if (s.unique_link && s.unique_link.includes(':5173:5173')) {
        const newLink = s.unique_link.replace(':5173:5173', ':5173');
        db.prepare(`UPDATE mission_services SET unique_link = ? WHERE id = ?`).run(newLink, s.id);
        console.log(`Fixed service ${s.id}: ${s.unique_link} -> ${newLink}`);
        fixed++;
    }
}

console.log(`\nDone. ${fixed} link(s) fixed.`);

// Show all links now
const all = db.prepare(`SELECT id, unique_link FROM mission_services`).all();
console.log('\nAll current links:');
all.forEach(s => console.log(`  Service ${s.id}: ${s.unique_link}`));
