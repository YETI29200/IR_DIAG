import { normalizeDimensionKey } from "./server/utils/openai.js";
import fs from "fs";

const recommendations = JSON.parse(fs.readFileSync('db_output.json', 'utf-8'));

const dimensionScores = [
    { id: 'usages_de_lia', label: "Usages de l'IA", score: 25 },
    { id: 'data', label: "Data", score: 50 },
    { id: 'competences_culture', label: "Compétences & Culture", score: 25 },
    { id: 'infrastructure', label: "Infrastructure", score: 25 },
    { id: 'strategie_vision', label: "Stratégie & Vision", score: 50 }
];

dimensionScores.forEach(d => {
    const normalizedId = normalizeDimensionKey(d.id);
    const rec = recommendations.find(r => r.dimension === d.id || r.dimension === normalizedId || normalizeDimensionKey(r.dimension) === normalizedId) || { title: 'N/A', description: 'N/A', actions: [] };

    console.log(`${d.label} => Title: ${rec.title}`);
});
