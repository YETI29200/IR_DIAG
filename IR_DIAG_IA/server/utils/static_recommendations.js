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
