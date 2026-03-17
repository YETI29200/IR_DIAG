import { sendEmailWithExchange, isExchangeConfigured } from './server/utils/exchange.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Exchange Configured:', isExchangeConfigured());
console.log('Host:', process.env.EXCHANGE_HOST);
console.log('Port:', process.env.EXCHANGE_PORT);

// To run this test: node test-email.js
// Note: This will attempt a real send if configured.
