// Email simulation routes with optional Exchange/SMTP integration
import { getDb } from '../db/index.js'
import { sendEmailWithExchange, isExchangeConfigured } from '../utils/exchange.js'

// Simple template engine (replaces {{variable}} with values)
function renderTemplate(template, variables) {
  let result = template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, variables[key] || '')
  })
  return result
}

export default async function emailRoutes(req, res, url, body) {
  const db = getDb()

  // GET /api/emails/templates
  if (req.method === 'GET' && url.pathname === '/api/emails/templates') {
    try {
      // Default templates (hardcoded)
      const defaultTemplates = [
        {
          id: 'invitation',
          name: 'Invitation au questionnaire',
          subject: 'Invitation au diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Vous êtes invité(e) à participer au diagnostic de maturité IA & Data pour {{organization_name}}.</p>
            <p>Cliquez sur le lien ci-dessous pour accéder au questionnaire :</p>
            <p><a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
            <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
            <p>Nous vous remercions de votre participation.</p>
            {{signature}}
          `
        },
        {
          id: 'reminder',
          name: 'Rappel questionnaire',
          subject: 'Rappel - Diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Ceci est un rappel pour compléter le diagnostic de maturité IA & Data pour {{organization_name}}.</p>
            <p>Lien : <a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
            <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
            <p>Votre participation est importante pour nous.</p>
            {{signature}}
          `
        },
        {
          id: 'results',
          name: 'Résultats du diagnostic',
          subject: 'Résultats du diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Les résultats du diagnostic de maturité IA & Data pour {{organization_name}} sont maintenant disponibles.</p>
            <p>Vous pouvez les consulter en suivant le lien ci-dessous :</p>
            <p><a href="{{results_link}}">{{results_link}}</a></p>
            {{signature}}
          `
        }
      ]

      // Get custom templates from database (if table exists)
      let customTemplates = []
      try {
        customTemplates = db.prepare(`
          SELECT id, name, subject, body_html as body, created_at, updated_at
          FROM email_templates
          ORDER BY name ASC
        `).all()
      } catch (err) {
        // Table doesn't exist yet, ignore
        console.log('[Email Templates] email_templates table not found, using default templates only')
      }

      // Combine default and custom templates
      const allTemplates = [...defaultTemplates, ...customTemplates.map(t => ({
        id: `custom_${t.id}`,
        name: t.name,
        subject: t.subject,
        body: t.body
      }))]

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(allTemplates))
    } catch (err) {
      console.error('Error loading email templates:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error loading email templates' }))
    }
    return
  }

  // POST /api/emails/templates (create custom template)
  if (req.method === 'POST' && url.pathname === '/api/emails/templates') {
    const { name, subject, body } = body || {}
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    if (!name || !subject || !body) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'name, subject, and body are required' }))
      return
    }

    try {
      // Create table if it doesn't exist
      db.prepare(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          subject TEXT NOT NULL,
          body_html TEXT NOT NULL,
          created_by INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (created_by) REFERENCES consultants(id) ON DELETE SET NULL
        )
      `).run()

      // Get consultant ID from token (simplified - in production, verify token properly)
      const consultant = db.prepare(`
        SELECT id FROM consultants WHERE id = (SELECT consultant_id FROM user_roles WHERE role = 'admin' LIMIT 1)
      `).get()

      const result = db.prepare(`
        INSERT INTO email_templates (name, subject, body_html, created_by)
        VALUES (?, ?, ?, ?)
      `).run(name, subject, body, consultant?.id || null)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ id: result.lastInsertRowid, success: true }))
    } catch (err) {
      console.error('Error creating email template:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error creating email template', message: err.message }))
    }
    return
  }

  // GET /api/emails/signature-templates
  if (req.method === 'GET' && url.pathname === '/api/emails/signature-templates') {
    try {
      // Create table if it doesn't exist
      db.prepare(`
        CREATE TABLE IF NOT EXISTS signature_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          html_content TEXT NOT NULL,
          is_default BOOLEAN NOT NULL DEFAULT 0,
          created_by INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (created_by) REFERENCES consultants(id) ON DELETE SET NULL
        )
      `).run()

      // Check if table has any templates, if not, insert default
      const count = db.prepare(`SELECT COUNT(*) as count FROM signature_templates`).get()
      if (count.count === 0) {
        db.prepare(`
          INSERT INTO signature_templates (name, html_content, is_default, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).run(
          'Signature Images & Réseaux - Par défaut',
          '<p>Cordialement,<br><strong>L\'équipe Images & Réseaux</strong><br>EDIH Bretagne et Pays de la Loire<br>European Digital Innovation Hub</p>',
          1
        )
      }

      const templates = db.prepare(`
        SELECT id, name, html_content, is_default, created_at, updated_at
        FROM signature_templates
        ORDER BY is_default DESC, name ASC
      `).all()

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(templates))
    } catch (err) {
      console.error('Error loading signature templates:', err)
      // Return empty array instead of error to prevent breaking the UI
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify([]))
    }
    return
  }

  // POST /api/emails/signature-templates
  if (req.method === 'POST' && url.pathname === '/api/emails/signature-templates') {
    const { name, html_content, is_default } = body || {}
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    // Get consultant ID from token (simplified - in production, verify token properly)
    const consultant = db.prepare(`
      SELECT id FROM consultants WHERE id = (SELECT consultant_id FROM user_roles WHERE role = 'admin' LIMIT 1)
    `).get()

    if (!name || !html_content) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'name and html_content required' }))
      return
    }

    try {
      // If this is set as default, unset other defaults
      if (is_default) {
        db.prepare(`UPDATE signature_templates SET is_default = 0`).run()
      }

      const result = db.prepare(`
        INSERT INTO signature_templates (name, html_content, is_default, created_by)
        VALUES (?, ?, ?, ?)
      `).run(name, html_content, is_default ? 1 : 0, consultant?.id || null)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ id: result.lastInsertRowid, success: true }))
    } catch (err) {
      console.error('Error creating signature template:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error creating signature template' }))
    }
    return
  }

  // POST /api/emails/preview
  if (req.method === 'POST' && url.pathname === '/api/emails/preview') {
    const { missionId, contactId, templateId, deadlineDate, customMessage, signatureTemplateId } = body || {}

    if (!missionId || !templateId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId and templateId required' }))
      return
    }

    try {
      // Get template (from default or custom)
      let template = null

      // Check if it's a custom template (starts with 'custom_')
      if (templateId.startsWith('custom_')) {
        const customId = parseInt(templateId.replace('custom_', ''))
        const customTemplate = db.prepare(`
          SELECT subject, body_html as body FROM email_templates WHERE id = ?
        `).get(customId)
        if (customTemplate) {
          template = {
            subject: customTemplate.subject,
            body: customTemplate.body
          }
        }
      } else {
        // Default templates
        const defaultTemplates = {
          invitation: {
            subject: 'Invitation au diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Vous êtes invité(e) à participer au diagnostic de maturité IA & Data pour {{organization_name}}.</p>
              <p>Cliquez sur le lien ci-dessous pour accéder au questionnaire :</p>
              <p><a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
              <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              <p>Nous vous remercions de votre participation.</p>
              {{signature}}
            `
          },
          reminder: {
            subject: 'Rappel - Diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Ceci est un rappel pour compléter le diagnostic de maturité IA & Data pour {{organization_name}}.</p>
              <p>Lien : <a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
              <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              <p>Votre participation est importante pour nous.</p>
              {{signature}}
            `
          },
          results: {
            subject: 'Résultats du diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Les résultats du diagnostic de maturité IA & Data pour {{organization_name}} sont maintenant disponibles.</p>
              <p>Vous pouvez les consulter en suivant le lien ci-dessous :</p>
              <p><a href="{{results_link}}">{{results_link}}</a></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              {{signature}}
            `
          }
        }
        template = defaultTemplates[templateId]
      }

      if (!template) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Template not found' }))
        return
      }

      // Get mission and consultant
      const mission = db.prepare(`
        SELECT m.organization_name, m.questionnaire_type, c.first_name as consultant_first_name, c.last_name as consultant_last_name
        FROM missions m
        LEFT JOIN consultants c ON m.consultant_id = c.id
        WHERE m.id = ?
      `).get(missionId)

      if (!mission) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Mission not found' }))
        return
      }

      // Get contact (use first contact if not specified)
      const contact = contactId
        ? db.prepare(`SELECT id, first_name, last_name, email, service_id, contact_token FROM mission_contacts WHERE id = ?`).get(contactId)
        : db.prepare(`SELECT id, first_name, last_name, email, service_id, contact_token FROM mission_contacts WHERE mission_id = ? LIMIT 1`).get(missionId)

      if (!contact) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Contact not found' }))
        return
      }

      // Get service link (pour invitation / rappel) ou lien vers les résultats
      const service = contact.service_id
        ? db.prepare(`SELECT code, unique_link FROM mission_services WHERE id = ?`).get(contact.service_id)
        : null

      const baseLink = service?.unique_link || `http://localhost:5173/questionnaire/${mission.questionnaire_type}/${missionId}?service=${service?.code || ''}`
      const questionnaireLink = contact.contact_token
        ? `${baseLink}&cid=${contact.contact_token}`
        : baseLink
      const resultsLink = `http://localhost:5173/results?mission=${missionId}`

      // Get signature template
      let signatureHtml = '<p>Cordialement,<br><strong>L\'équipe Images & Réseaux</strong></p>'
      if (signatureTemplateId) {
        const signatureTemplate = db.prepare(`
          SELECT html_content FROM signature_templates WHERE id = ?
        `).get(signatureTemplateId)
        if (signatureTemplate) {
          signatureHtml = signatureTemplate.html_content
        }
      } else {
        // Use default signature
        const defaultSignature = db.prepare(`
          SELECT html_content FROM signature_templates WHERE is_default = 1 LIMIT 1
        `).get()
        if (defaultSignature) {
          signatureHtml = defaultSignature.html_content
        }
      }

      const consultantName = `${mission.consultant_first_name || ''} ${mission.consultant_last_name || ''}`.trim() || 'L\'équipe Images & Réseaux'

      // Format deadline date
      const formattedDeadline = deadlineDate
        ? new Date(deadlineDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Non spécifiée'

      const allVariables = {
        contact_first_name: contact.first_name || '',
        contact_last_name: contact.last_name || '',
        contact_email: contact.email || '',
        organization_name: mission.organization_name || '',
        questionnaire_link: questionnaireLink,
        results_link: resultsLink,
        deadline_date: formattedDeadline,
        consultant_name: consultantName,
        signature: signatureHtml,
        ...(customMessage ? { custom_message: customMessage } : {})
      }

      const renderedSubject = renderTemplate(template.subject, allVariables)
      const renderedBody = renderTemplate(template.body, allVariables)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        subject: renderedSubject,
        body: renderedBody,
        to: contact.email
      }))
    } catch (err) {
      console.error('Error generating preview:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error generating preview' }))
    }
    return
  }

  // POST /api/emails/send-bulk (send to multiple contacts with deadline)
  if (req.method === 'POST' && url.pathname === '/api/emails/send-bulk') {
    const { missionId, contactIds, templateId, deadlineDate, customMessage, signatureTemplateId } = body || {}

    if (!missionId || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0 || !templateId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId, contactIds (array), and templateId required' }))
      return
    }

    try {
      // Get template (from default or custom)
      let template = null

      // Check if it's a custom template (starts with 'custom_')
      if (templateId.startsWith('custom_')) {
        const customId = parseInt(templateId.replace('custom_', ''))
        const customTemplate = db.prepare(`
          SELECT subject, body_html as body FROM email_templates WHERE id = ?
        `).get(customId)
        if (customTemplate) {
          template = {
            subject: customTemplate.subject,
            body: customTemplate.body
          }
        }
      } else {
        // Default templates
        const defaultTemplates = {
          invitation: {
            subject: 'Invitation au diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Vous êtes invité(e) à participer au diagnostic de maturité IA & Data pour {{organization_name}}.</p>
              <p>Cliquez sur le lien ci-dessous pour accéder au questionnaire :</p>
              <p><a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
              <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              <p>Nous vous remercions de votre participation.</p>
              {{signature}}
            `
          },
          reminder: {
            subject: 'Rappel - Diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Ceci est un rappel pour compléter le diagnostic de maturité IA & Data pour {{organization_name}}.</p>
              <p>Lien : <a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
              <p><strong>Date limite de réponse : {{deadline_date}}</strong></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              <p>Votre participation est importante pour nous.</p>
              {{signature}}
            `
          },
          results: {
            subject: 'Résultats du diagnostic IA & Data - {{organization_name}}',
            body: `
              <h2>Bonjour {{contact_first_name}},</h2>
              <p>Les résultats du diagnostic de maturité IA & Data pour {{organization_name}} sont maintenant disponibles.</p>
              <p>Vous pouvez les consulter en suivant le lien ci-dessous :</p>
              <p><a href="{{results_link}}">{{results_link}}</a></p>
              ${customMessage ? `<p>${customMessage}</p>` : ''}
              {{signature}}
            `
          }
        }
        template = defaultTemplates[templateId]
      }

      if (!template) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Template not found' }))
        return
      }

      // Get mission and consultant
      const mission = db.prepare(`
        SELECT m.organization_name, m.questionnaire_type, c.first_name as consultant_first_name, c.last_name as consultant_last_name
        FROM missions m
        LEFT JOIN consultants c ON m.consultant_id = c.id
        WHERE m.id = ?
      `).get(missionId)

      if (!mission) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Mission not found' }))
        return
      }

      const consultantName = `${mission.consultant_first_name || ''} ${mission.consultant_last_name || ''}`.trim() || 'L\'équipe Images & Réseaux'

      // Format deadline date
      const formattedDeadline = deadlineDate
        ? new Date(deadlineDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Non spécifiée'

      // Get signature template
      let signatureHtml = '<p>Cordialement,<br><strong>L\'équipe Images & Réseaux</strong></p>'
      if (signatureTemplateId) {
        const signatureTemplate = db.prepare(`
          SELECT html_content FROM signature_templates WHERE id = ?
        `).get(signatureTemplateId)
        if (signatureTemplate) {
          signatureHtml = signatureTemplate.html_content
        }
      } else {
        // Use default signature
        const defaultSignature = db.prepare(`
          SELECT html_content FROM signature_templates WHERE is_default = 1 LIMIT 1
        `).get()
        if (defaultSignature) {
          signatureHtml = defaultSignature.html_content
        }
      }

      // Get contacts and their service links (including contact_token for personalized URLs)
      const placeholders = contactIds.map(() => '?').join(',')
      const contacts = db.prepare(`
        SELECT c.id, c.first_name, c.last_name, c.email, c.service_id, c.contact_token,
               s.code as service_code, s.unique_link
        FROM mission_contacts c
        LEFT JOIN mission_services s ON c.service_id = s.id
        WHERE c.id IN (${placeholders})
      `).all(...contactIds)

      const results = []
      for (const contact of contacts) {
        // Build personalized link: base service link + contact token for individual tracking
        const baseLink = contact.unique_link || `http://localhost:5173/questionnaire/${mission.questionnaire_type}/${missionId}?service=${contact.service_code || ''}`
        const questionnaireLink = contact.contact_token
          ? `${baseLink}&cid=${contact.contact_token}`
          : baseLink
        const resultsLink = `${process.env.BASE_URL || 'http://localhost:5173'}/results?mission=${missionId}`

        const allVariables = {
          contact_first_name: contact.first_name || '',
          contact_last_name: contact.last_name || '',
          contact_email: contact.email || '',
          organization_name: mission.organization_name || '',
          questionnaire_link: questionnaireLink,
          results_link: resultsLink,
          deadline_date: formattedDeadline,
          consultant_name: consultantName,
          signature: signatureHtml,
          ...(customMessage ? { custom_message: customMessage } : {})
        }

        const renderedSubject = renderTemplate(template.subject, allVariables)
        const renderedBody = renderTemplate(template.body, allVariables)

        // Try to send via Exchange/SMTP if configured
        let emailStatus = 'simulated_sent'
        let errorMessage = null

        if (isExchangeConfigured()) {
          try {
            await sendEmailWithExchange(contact.email, renderedSubject, renderedBody, body.attachment)
            emailStatus = 'sent'
          } catch (error) {
            console.error(`Failed to send email to ${contact.email}:`, error)
            emailStatus = 'failed'
            errorMessage = error.message
          }
        }

        // Log email
        const logResult = db.prepare(`
          INSERT INTO email_logs (mission_id, contact_id, template_name, subject, body_html, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(missionId, contact.id, templateId, renderedSubject, renderedBody, emailStatus)

        results.push({
          contactId: contact.id,
          email: contact.email,
          status: emailStatus,
          emailId: logResult.lastInsertRowid,
          error: errorMessage
        })
      }

      const successCount = results.filter(r => r.status === 'sent' || r.status === 'simulated_sent').length
      const failedCount = results.filter(r => r.status === 'failed').length

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        total: results.length,
        sent: successCount,
        failed: failedCount,
        results,
        deadlineDate: formattedDeadline
      }))
    } catch (error) {
      console.error('Error sending bulk emails:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error', message: error.message }))
    }
    return
  }

  // POST /api/emails/send (simulate send)
  if (req.method === 'POST' && url.pathname === '/api/emails/send') {
    const { missionId, contactId, templateId, variables, deadlineDate } = body || {}

    if (!missionId || !contactId || !templateId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId, contactId, and templateId required' }))
      return
    }

    try {
      // Get template (hardcoded for now)
      const templates = {
        invitation: {
          subject: 'Invitation au diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Vous êtes invité(e) à participer au diagnostic de maturité IA & Data pour {{organization_name}}.</p>
            <p>Cliquez sur le lien ci-dessous pour accéder au questionnaire :</p>
            <p><a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
            <p>Cordialement,<br>{{consultant_name}}</p>
          `
        },
        reminder: {
          subject: 'Rappel - Diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Ceci est un rappel pour compléter le diagnostic de maturité IA & Data.</p>
            <p>Lien : <a href="{{questionnaire_link}}">{{questionnaire_link}}</a></p>
            <p>Cordialement,<br>{{consultant_name}}</p>
          `
        },
        results: {
          subject: 'Résultats du diagnostic IA & Data - {{organization_name}}',
          body: `
            <h2>Bonjour {{contact_first_name}},</h2>
            <p>Les résultats du diagnostic sont maintenant disponibles.</p>
            <p>Consultez-les ici : <a href="{{results_link}}">{{results_link}}</a></p>
            <p>Cordialement,<br>{{consultant_name}}</p>
          `
        }
      }

      const template = templates[templateId]
      if (!template) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Template not found' }))
        return
      }

      // Get contact and mission for variables
      const contact = db.prepare(`
        SELECT first_name, last_name, email
        FROM mission_contacts
        WHERE id = ?
      `).get(contactId)

      const mission = db.prepare(`
        SELECT organization_name
        FROM missions
        WHERE id = ?
      `).get(missionId)

      // Merge variables
      const allVariables = {
        contact_first_name: contact?.first_name || '',
        contact_last_name: contact?.last_name || '',
        contact_email: contact?.email || '',
        organization_name: mission?.organization_name || '',
        ...variables
      }

      // Render template
      const renderedSubject = renderTemplate(template.subject, allVariables)
      const renderedBody = renderTemplate(template.body, allVariables)

      // Try to send via Exchange/SMTP if configured, otherwise simulate
      let emailStatus = 'simulated_sent'
      let exchangeMessageId = null
      let errorMessage = null

      if (isExchangeConfigured()) {
        try {
          const exchangeResult = await sendEmailWithExchange(
            contact.email,
            renderedSubject,
            renderedBody,
            body.attachment
          )
          emailStatus = 'sent'
          exchangeMessageId = exchangeResult.message || 'sent'
        } catch (error) {
          console.error('Failed to send email via Exchange:', error)
          emailStatus = 'failed'
          errorMessage = error.message
          // Fallback to simulation
        }
      }

      // Log email
      const result = db.prepare(`
        INSERT INTO email_logs (mission_id, contact_id, template_name, subject, body_html, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(missionId, contactId, templateId, renderedSubject, renderedBody, emailStatus)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: emailStatus === 'sent' || emailStatus === 'simulated_sent',
        emailId: result.lastInsertRowid,
        subject: renderedSubject,
        body: renderedBody,
        status: emailStatus,
        exchangeMessageId: exchangeMessageId,
        error: errorMessage,
        configured: isExchangeConfigured()
      }))
    } catch (error) {
      console.error('Error sending email:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // GET /api/emails/logs?missionId=X
  if (req.method === 'GET' && url.pathname === '/api/emails/logs') {
    const missionId = url.searchParams.get('missionId')

    if (!missionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId required' }))
      return
    }

    try {
      const logs = db.prepare(`
        SELECT l.id, l.mission_id, l.contact_id, l.template_name, l.subject, l.body_html, l.status, l.sent_at, c.email as recipient_email, c.first_name, c.last_name
        FROM email_logs l
        LEFT JOIN mission_contacts c ON l.contact_id = c.id
        WHERE l.mission_id = ?
        ORDER BY l.sent_at DESC
      `).all(missionId)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(logs.map(log => {
        // Fix SQL date format for browser parsing (replace space with T)
        const sentAt = log.sent_at ? log.sent_at.replace(' ', 'T') : null;
        const recipientName = log.first_name || log.last_name
          ? `${log.first_name || ''} ${log.last_name || ''}`.trim()
          : log.recipient_email;

        return {
          id: log.id,
          missionId: log.mission_id,
          contactId: log.contact_id,
          recipientName: recipientName,
          recipientEmail: log.recipient_email,
          templateName: log.template_name,
          subject: log.subject,
          bodyHtml: log.body_html,
          status: log.status,
          sentAt: sentAt
        }
      })))
    } catch (error) {
      console.error('Error fetching email logs:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // POST /api/emails/send-confirmation
  // Envoie un email de confirmation au chef de projet après un envoi groupé
  if (req.method === 'POST' && url.pathname === '/api/emails/send-confirmation') {
    const { to, missionName, sentCount, failedCount } = body || {}

    if (!to || !missionName) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'to and missionName required' }))
      return
    }

    try {
      const subject = `[IR-DIAG] Envoi questionnaires — ${missionName}`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00B1E6, #0093c0); padding: 30px; border-radius: 12px; text-align: center; color: white; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 1.5rem;">✅ Questionnaires envoyés</h1>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <p style="margin: 0 0 16px; font-size: 1rem; color: #111827;">
              Les questionnaires pour la mission <strong>${missionName}</strong> ont été envoyés avec succès.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Emails envoyés</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #10b981;">✅ ${sentCount}</td>
              </tr>
              ${failedCount > 0 ? `<tr>
                <td style="padding: 10px 0; color: #6b7280;">Échecs</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ef4444;">❌ ${failedCount}</td>
              </tr>` : ''}
            </table>
          </div>
          <p style="font-size: 0.875rem; color: #9ca3af; text-align: center;">
            Vous pouvez suivre les réponses en temps réel dans votre espace administrateur.
          </p>
        </div>
      `

      await sendEmailWithExchange({ to, subject, html })

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (error) {
      console.error('Error sending confirmation email:', error)
      // On ne bloque pas si l'email de confirmation échoue
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: error.message }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

