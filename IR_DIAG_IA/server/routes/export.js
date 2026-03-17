import puppeteer from 'puppeteer'

export default async function exportRoutes(req, res, url, parsedBody) {
    if (url.pathname !== '/api/export/pdf') return

    const searchParams = url.searchParams
    const missionId = searchParams.get('mission')
    const mode = searchParams.get('mode') || 'synthetic'

    if (!missionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Missing mission parameter' }))
        return
    }

    let browser = null
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        const page = await browser.newPage()

        // Determine target URL
        const port = process.env.PORT || 3000
        const devClientUrl = 'http://localhost:5173'
        const prodClientUrl = `http://localhost:${port}`

        const clientHost = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? prodClientUrl : devClientUrl)
        const targetUrl = `${clientHost}/print-report?mission=${missionId}&mode=${mode}`

        console.log(`[Export] Generating PDF for ${targetUrl}`)

        // Navigate and wait
        // We increase timeout for heavy reports
        await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 120000 })

        // Wait for the specific report content to confirm it's loaded
        try {
            await page.waitForSelector('#report-content', { timeout: 60000 })
        } catch (e) {
            throw new Error('Timeout waiting for #report-content. The page might have failed to load.')
        }

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: true
        })

        await browser.close()
        browser = null

        // Send response
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="Rapport_${mode}_${missionId}.pdf"`)
        res.end(pdfBuffer)

    } catch (error) {
        console.error('[Export] Error:', error)
        if (browser) await browser.close()

        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message }))
    }
}
