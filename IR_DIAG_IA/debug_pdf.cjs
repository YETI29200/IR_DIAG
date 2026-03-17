const { spawn } = require('child_process');
const path = require('path');

const pythonScriptPath = path.join(__dirname, 'server', 'utils', 'pdf_generator.py');
const inputData = JSON.stringify({
    scores: [50, 60, 70, 80, 90],
    labels: ["Usages de l’IA", "Data", "Compétences & Culture", "Infrastructure", "Stratégie & Vision"],
    recommendations_data: [
        { title: "Test Title", description: "Test Desc", actions: ["Action 1", "Action 2"] },
        { title: "Test Title", description: "Test Desc", actions: ["Action 1", "Action 2"] },
        { title: "Test Title", description: "Test Desc", actions: ["Action 1", "Action 2"] },
        { title: "Test Title", description: "Test Desc", actions: ["Action 1", "Action 2"] },
        { title: "Test Title", description: "Test Desc", actions: ["Action 1", "Action 2"] }
    ],
    organization: "Test Org"
});

const pyProcess = spawn('python', [pythonScriptPath, '--json', inputData, '--out', 'test_from_node.pdf']);

pyProcess.stdout.on('data', (data) => console.log(`stdout: ${data}`));
pyProcess.stderr.on('data', (data) => console.error(`stderr: ${data}`));
pyProcess.on('close', (code) => console.log(`child process exited with code ${code}`));
