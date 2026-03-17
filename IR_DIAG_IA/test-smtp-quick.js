import { readFileSync, existsSync } from 'fs'

const envPath = './.env'
if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=')
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
                process.env[key.trim()] = value
            }
        }
    })
}

import('./server/utils/exchange.js').then(async ({ sendEmailWithExchange }) => {
    try {
        console.log('Testing email send...');
        const result = await sendEmailWithExchange('ydeniaux@images-et-reseaux.com', 'Test Mailing list', '<p>Test</p>');
        console.log('Success:', result);
    } catch (e) {
        console.error('Failed:', e);
    }
});
