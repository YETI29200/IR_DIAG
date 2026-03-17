import nodemailer from 'nodemailer'
import { readFileSync, existsSync, writeFileSync } from 'fs'

// Manual env loading
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

const EXCHANGE_HOST = process.env.EXCHANGE_HOST
const EXCHANGE_PORT = parseInt(process.env.EXCHANGE_PORT || '25')
const EXCHANGE_USER = process.env.EXCHANGE_USER
const EXCHANGE_PASSWORD = process.env.EXCHANGE_PASSWORD
const EXCHANGE_FROM = process.env.EXCHANGE_FROM_EMAIL

const results = []

function log(msg) {
    console.log(msg)
    results.push(msg)
}

log('=== Configuration SMTP ===')
log('Host: ' + EXCHANGE_HOST)
log('Port: ' + EXCHANGE_PORT)
log('User: ' + (EXCHANGE_USER ? '***' : 'None (relay mode)'))
log('From: ' + EXCHANGE_FROM)
log('==========================')
log('')

// Test 1: With STARTTLS (current config)
async function testWithStartTLS() {
    log('--- Test 1: Avec STARTTLS (config actuelle) ---')
    const transporter = nodemailer.createTransport({
        host: EXCHANGE_HOST,
        port: EXCHANGE_PORT,
        secure: false,
        auth: (EXCHANGE_USER && EXCHANGE_PASSWORD) ? {
            user: EXCHANGE_USER, pass: EXCHANGE_PASSWORD,
        } : undefined,
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    })
    try {
        await transporter.verify()
        log('RESULT_1: OK')
        return true
    } catch (error) {
        log('RESULT_1: FAIL - ' + error.message + ' (code: ' + error.code + ')')
        return false
    }
}

// Test 2: Without TLS at all (ignoreTLS)
async function testWithoutTLS() {
    log('--- Test 2: Sans TLS (ignoreTLS: true) ---')
    const transporter = nodemailer.createTransport({
        host: EXCHANGE_HOST,
        port: EXCHANGE_PORT,
        secure: false,
        ignoreTLS: true,
        auth: (EXCHANGE_USER && EXCHANGE_PASSWORD) ? {
            user: EXCHANGE_USER, pass: EXCHANGE_PASSWORD,
        } : undefined,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    })
    try {
        await transporter.verify()
        log('RESULT_2: OK')
        return true
    } catch (error) {
        log('RESULT_2: FAIL - ' + error.message + ' (code: ' + error.code + ')')
        return false
    }
}

// Test 3: With opportunistic TLS
async function testOpportunisticTLS() {
    log('--- Test 3: TLS opportuniste ---')
    const transporter = nodemailer.createTransport({
        host: EXCHANGE_HOST,
        port: EXCHANGE_PORT,
        secure: false,
        requireTLS: false,
        opportunisticTLS: true,
        auth: (EXCHANGE_USER && EXCHANGE_PASSWORD) ? {
            user: EXCHANGE_USER, pass: EXCHANGE_PASSWORD,
        } : undefined,
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    })
    try {
        await transporter.verify()
        log('RESULT_3: OK')
        return true
    } catch (error) {
        log('RESULT_3: FAIL - ' + error.message + ' (code: ' + error.code + ')')
        return false
    }
}

// Test 4: Send actual test email with ignoreTLS
async function testSendEmail() {
    log('--- Test 4: Envoi réel avec ignoreTLS ---')
    const transporter = nodemailer.createTransport({
        host: EXCHANGE_HOST,
        port: EXCHANGE_PORT,
        secure: false,
        ignoreTLS: true,
        auth: (EXCHANGE_USER && EXCHANGE_PASSWORD) ? {
            user: EXCHANGE_USER, pass: EXCHANGE_PASSWORD,
        } : undefined,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    })
    try {
        const info = await transporter.sendMail({
            from: EXCHANGE_FROM,
            to: EXCHANGE_FROM,
            subject: 'Test IR DIAG - ' + new Date().toISOString(),
            text: 'Ceci est un test automatique.'
        })
        log('RESULT_4: OK - messageId: ' + info.messageId)
        return true
    } catch (error) {
        log('RESULT_4: FAIL - ' + error.message + ' (code: ' + error.code + ')')
        return false
    }
}

async function run() {
    const r1 = await testWithStartTLS()
    const r2 = await testWithoutTLS()
    const r3 = await testOpportunisticTLS()

    log('')
    log('=== RESUME ===')
    log('Test 1 (STARTTLS):       ' + (r1 ? 'OK' : 'FAIL'))
    log('Test 2 (ignoreTLS):      ' + (r2 ? 'OK' : 'FAIL'))
    log('Test 3 (opportunistic):  ' + (r3 ? 'OK' : 'FAIL'))

    if (r2) {
        log('')
        log('=> Le test 2 (ignoreTLS) fonctionne. Envoi email de test...')
        const r4 = await testSendEmail()
        log('Test 4 (envoi réel):     ' + (r4 ? 'OK' : 'FAIL'))
    }

    // Write results to file
    writeFileSync('./smtp-results.txt', results.join('\n'), 'utf-8')
    log('\nRésultats écrits dans smtp-results.txt')
}

run()
