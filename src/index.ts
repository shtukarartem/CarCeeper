import { startBotWithConfig } from './bot/bot.js';
import { loadAppConfig } from './config/env.js';
import { startHealthServer } from './server/healthServer.js';

const config = loadAppConfig();

await startHealthServer(config.port);
await startBotWithConfig(config);
