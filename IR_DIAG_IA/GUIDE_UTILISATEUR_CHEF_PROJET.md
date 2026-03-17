# Guide Utilisateur - Chef de Projet
## Plateforme de Diagnostic Maturité IA & Data

Ce guide explique comment utiliser la plateforme pour créer des diagnostics, envoyer des invitations, analyser les résultats et générer des rapports.

---

### 1. Démarrage de l'Application

Pour lancer l'application sur votre poste :
1. Double-cliquez sur le fichier `start-servers.bat` sur votre bureau ou dans le dossier du projet.
2. Une fenêtre de commande noire va s'ouvrir (ne la fermez pas).
3. Votre navigateur s'ouvrira automatiquement sur la page de connexion.
4. Si ce n'est pas le cas, allez sur : `http://localhost:5173`

---

### 2. Création d'une Mission (Diagnostic)

Une "Mission" correspond à une campagne d'évaluation pour une entreprise ou une organisation.

1. Connectez-vous en tant qu'administrateur.
2. Allez dans le menu **Mes Missions**.
3. Cliquez sur **+ Nouvelle Mission**.
4. Remplissez les informations :
   - **Nom de l'organisation** : Le client (ex: "Acme Corp").
   - **Type de questionnaire** :
     - *Flash* : Version courte (5 dimensions, idéal pour une première approche).
     - *Complet* : Version détaillée (10 dimensions).
5. Cliquez sur **Créer**.

---

### 3. Gestion des Invitations

Une fois la mission créée, vous devez inviter les participants.

1. Cliquez sur la mission dans la liste.
2. Allez dans l'onglet **Services & Participants**.
3. Vous pouvez ajouter des services (ex: "RH", "IT", "Marketing") pour segmenter les résultats.
4. Pour inviter quelqu'un :
   - Saisissez son **email**.
   - Sélectionnez son **service** (optionnel mais recommandé).
   - Cliquez sur **Envoyer l'invitation**.
   - Il recevra un lien unique pour répondre au questionnaire.

> **Astuce** : Vous pouvez aussi copier le "Lien générique" et l'envoyer par vos propres moyens (Teams, mail perso), mais vous perdrez le suivi individuel "répondu/non répondu".

---

### 4. Suivi et Analyse des Résultats

Dès qu'une personne répond, les résultats sont mis à jour en temps réel.

1. Allez dans l'onglet **Résultats**.
2. Vous voyez la **Vue Globale** (toute l'entreprise) avec le score moyen et le graphique radar.
3. En dessous, vous avez le détail par **Dimension** (Ambition, Données, etc.).
4. Vous pouvez filtrer les résultats par **Service** en utilisant la liste déroulante en haut à droite.

---

### 5. Génération des Recommandations IA (Nouveau : Gemini)

L'intelligence artificielle (Google Gemini) analyse les scores pour proposer un plan d'action.

**Génération Automatique :**
- À l'ouverture de la page de résultats, une première analyse est faite automatiquement.

**Régénération Manuelle (Affiner les résultats) :**
1. Cliquez sur le bouton violet **✨ Régénérer** (en haut pour le global, ou au niveau de chaque dimension/service).
2. Une fenêtre s'ouvre pour personnaliser la demande :
   - **Langue** : Choisissez **Français** ou **Anglais** (Idéal pour les services internationaux).
   - **Ton** : Professionnel, Encouruageant, Direct, etc.
   - **Niveau de détail** : Synthétique ou Détaillé.
   - **Contexte** : Ajoutez des infos spécifiques (ex: "C'est une PME industrielle", "Focus sur la cybersécurité").
3. Validez. L'IA va réécrire les recommandations (Synthèse, Description, Actions).

> **Note importante** : La régénération se fait par périmètre. Si vous régénérez les recommandations du service "IT" en anglais, cela ne change pas les recommandations globales qui restent en français.

---

### 6. Export du Rapport PDF

Pour livrer le diagnostic au client :

1. Cliquez sur le bouton **Imprimer le rapport** en haut de la page de résultats.
2. Une page d'aperçu s'ouvre (sans les menus de navigation).
3. Le rapport contient :
   - Page de garde personnalisée.
   - Rappel des dimensions.
   - Résultats globaux (Note, Radar).
   - Synthèse globale.
   - Détail par dimension (Graphiques + Recommandations).
   - Focus par Service (si des services ont été définis).
4. Utilisez la fonction d'impression de votre navigateur (`Ctrl + P` ou clic droit > Imprimer).
5. Choisissez la destination **Enregistrer au format PDF**.
6. Dans les options ("Plus de paramètres") :
   - **Mise en page** : Paysage.
   - **Graphiques d'arrière-plan** : **Coché** (Très important pour avoir les couleurs et fonds de page !).
   - **Marges** : Aucune ou Par défaut.

---

### 7. Résolution de problèmes fréquents

- **Le rapport PDF est blanc ou mal mis en page ?**
  Vérifiez bien l'option "Graphiques d'arrière-plan" dans la fenêtre d'impression.
- **Les recommandations sont en anglais alors que je veux du français ?**
  Cliquez sur "Régénérer" et sélectionnez bien "Français".
- **L'application ne se lance pas ?**
  Vérifiez que la fenêtre noire (serveur) est bien ouverte. Si elle s'est fermée, relancez `start-servers.bat`.

---
*Support Technique : Contactez votre administrateur système.*
