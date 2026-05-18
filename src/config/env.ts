import dotenv from 'dotenv';

dotenv.config();

const allowedNodeEnvs = ['development', 'test', 'production'] as const;
const allowedBotModes = ['polling', 'webhook'] as const;

export type NodeEnv = (typeof allowedNodeEnvs)[number];
export type BotMode = (typeof allowedBotModes)[number];

export type DatabaseConfig = {
  databaseUrl: string;
};

export type AppConfig = DatabaseConfig & {
  databaseUrl: string;
  botMode: BotMode;
  defaultCurrency: string;
  nodeEnv: NodeEnv;
  port: number;
  reminderCheckIntervalMinutes: number;
  telegramBotToken: string;
  webhookSecret?: string;
  webhookUrl?: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function validateDatabaseUrl(value: string): string {
  try {
    const url = new URL(value);

    if (!url.protocol.startsWith('postgres')) {
      throw new Error('invalid protocol');
    }

    return value;
  } catch {
    throw new Error('Invalid DATABASE_URL: expected a valid PostgreSQL connection URL');
  }
}

function loadDefaultCurrency(): string {
  const currency = process.env.DEFAULT_CURRENCY?.trim() || 'BYN';

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Invalid DEFAULT_CURRENCY: expected 3-letter uppercase ISO currency code');
  }

  return currency;
}

function loadNodeEnv(): NodeEnv {
  const nodeEnv = process.env.NODE_ENV?.trim() || 'development';

  if (!allowedNodeEnvs.includes(nodeEnv as NodeEnv)) {
    throw new Error('Invalid NODE_ENV: expected development, test, or production');
  }

  return nodeEnv as NodeEnv;
}

function loadBotMode(): BotMode {
  const botMode = process.env.BOT_MODE?.trim() || 'polling';

  if (!allowedBotModes.includes(botMode as BotMode)) {
    throw new Error('Invalid BOT_MODE: expected polling or webhook');
  }

  return botMode as BotMode;
}

function loadPort(): number {
  const rawPort = process.env.PORT?.trim() || '3000';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid PORT: expected an integer between 1 and 65535');
  }

  return port;
}

function loadReminderCheckIntervalMinutes(): number {
  const rawValue = process.env.REMINDER_CHECK_INTERVAL_MINUTES?.trim() || '1440';
  const interval = Number(rawValue);

  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error('Invalid REMINDER_CHECK_INTERVAL_MINUTES: expected a positive integer');
  }

  return interval;
}

export function loadDatabaseConfig(): DatabaseConfig {
  return {
    databaseUrl: validateDatabaseUrl(getRequiredEnv('DATABASE_URL'))
  };
}

export function loadAppConfig(): AppConfig {
  const databaseConfig = loadDatabaseConfig();
  const nodeEnv = loadNodeEnv();

  return {
    ...databaseConfig,
    botMode: loadBotMode(),
    defaultCurrency: loadDefaultCurrency(),
    nodeEnv,
    port: loadPort(),
    reminderCheckIntervalMinutes: loadReminderCheckIntervalMinutes(),
    telegramBotToken: getRequiredEnv('TELEGRAM_BOT_TOKEN'),
    webhookSecret: process.env.WEBHOOK_SECRET?.trim() || undefined,
    webhookUrl: process.env.WEBHOOK_URL?.trim() || undefined,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test'
  };
}
