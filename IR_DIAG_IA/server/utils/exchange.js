import { createConnection } from 'net'

const EXCHANGE_HOST = process.env.EXCHANGE_HOST || 'exchange.images-et-reseaux.com'
const EXCHANGE_PORT = 25
const EXCHANGE_FROM = process.env.EXCHANGE_FROM_EMAIL || 'noreply@images-et-reseaux.com'

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = ''

    const handler = (data) => {
      buffer += data.toString()

      const lines = buffer.split('\r\n')

      for (const line of lines) {
        if (line.length >= 4 && line[3] === ' ') {
          socket.removeListener('data', handler)
          resolve(buffer.trim())
          return
        }
      }
    }

    socket.on('data', handler)
    socket.once('error', reject)
  })
}

function send(socket, cmd) {
  socket.write(cmd + '\r\n')
}

export async function sendEmailWithExchange(to, subject, html) {

  return new Promise((resolve, reject) => {

    const socket = createConnection({
      host: EXCHANGE_HOST,
      port: EXCHANGE_PORT
    })

    socket.once('error', reject)

    socket.once('connect', async () => {

      try {

        await readResponse(socket) // 220

        send(socket, `EHLO localhost`)
        await readResponse(socket)

        send(socket, `MAIL FROM:<${EXCHANGE_FROM}>`)
        await readResponse(socket)

        send(socket, `RCPT TO:<${to}>`)
        await readResponse(socket)

        send(socket, `DATA`)
        await readResponse(socket)

		const message = [
		  `From: ${EXCHANGE_FROM}`,
		  `To: ${to}`,
		  `Subject: ${subject}`,
		  `MIME-Version: 1.0`,
		  `Content-Type: text/html; charset=UTF-8`,
		  ``,
		  html,
		  ``
		].join('\r\n')

		socket.write(message + '\r\n.\r\n')

        await readResponse(socket)

        send(socket, 'QUIT')

        socket.end()

        resolve({
          success: true,
          message: 'Mail envoyé via Exchange'
        })

      } catch (err) {
        socket.destroy()
        reject(err)
      }

    })
  })
}

export function isExchangeConfigured() {
  return true
}
