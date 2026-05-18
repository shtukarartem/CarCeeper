import { loadAppConfig } from './env.js';

try {
  const config = loadAppConfig();

  console.log('Application config: ok');
  console.log(`NODE_ENV: ${config.nodeEnv}`);
  console.log(`BOT_MODE: ${config.botMode}`);
  console.log(`DEFAULT_CURRENCY: ${config.defaultCurrency}`);
  console.log(`PORT: ${config.port}`);
  console.log(`REMINDER_CHECK_INTERVAL_MINUTES: ${config.reminderCheckIntervalMinutes}`);
  console.log('DATABASE_URL: set');
  console.log('TELEGRAM_BOT_TOKEN: set');
  console.log(`WEBHOOK_URL: ${config.webhookUrl ? 'set' : 'not set'}`);
  console.log(`WEBHOOK_SECRET: ${config.webhookSecret ? 'set' : 'not set'}`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown configuration error';

  console.error(`Configuration error: ${message}`);
  process.exitCode = 1;
}
