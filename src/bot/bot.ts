import { Bot } from 'grammy';
import { type AppConfig, loadAppConfig } from '../config/env.js';
import { registerAddCommand } from './commands/add.js';
import { registerCancelCommand } from './commands/cancel.js';
import { registerCarCommand } from './commands/car.js';
import { registerCategoriesCommand } from './commands/categories.js';
import { registerDoneCommand } from './commands/done.js';
import { registerExamplesCommand } from './commands/examples.js';
import { registerExportCommand } from './commands/export.js';
import { registerFuelCommand } from './commands/fuel.js';
import { registerFuelStatsCommand } from './commands/fuelStats.js';
import { registerHelpCommand } from './commands/help.js';
import { registerHistoryCommand } from './commands/history.js';
import { registerMenuCommand } from './commands/menu.js';
import { registerMileageCommand } from './commands/mileage.js';
import { registerPlaceholderCommands } from './commands/placeholders.js';
import { registerRemindCommand } from './commands/remind.js';
import { registerReportCommand } from './commands/report.js';
import { registerServiceCommand } from './commands/service.js';
import { registerServiceDueCommand } from './commands/serviceDue.js';
import { registerServiceTypesCommand } from './commands/serviceTypes.js';
import { registerServicesCommand } from './commands/services.js';
import { registerStartCommand } from './commands/start.js';
import { registerStatsCommand } from './commands/stats.js';
import { registerTodayCommand } from './commands/today.js';
import { registerTodoCommand } from './commands/todo.js';
import { registerUndoCommand } from './commands/undo.js';
import { registerUnknownMessageHandler } from './handlers/unknown.js';
import { botCommandMenu } from './commandMenu.js';
import { registerExpenseFlow } from './flows/expenseFlow.js';
import { registerFuelFlow } from './flows/fuelFlow.js';
import { registerServiceFlow } from './flows/serviceFlow.js';
import { startReminderScheduler } from '../services/reminderScheduler.js';
import { createTelegramReminderNotificationSender } from '../services/telegramReminderNotificationSender.js';

export function createBot(config = loadAppConfig()): Bot {
  const bot = new Bot(config.telegramBotToken);

  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerExamplesCommand(bot);
  registerMenuCommand(bot);
  registerCancelCommand(bot);
  registerCarCommand(bot);
  registerAddCommand(bot);
  registerMileageCommand(bot);
  registerRemindCommand(bot);
  registerTodoCommand(bot);
  registerDoneCommand(bot);
  registerFuelCommand(bot);
  registerFuelStatsCommand(bot);
  registerServiceCommand(bot);
  registerServicesCommand(bot);
  registerServiceDueCommand(bot);
  registerServiceTypesCommand(bot);
  registerHistoryCommand(bot);
  registerTodayCommand(bot);
  registerStatsCommand(bot);
  registerReportCommand(bot);
  registerExportCommand(bot);
  registerUndoCommand(bot);
  registerCategoriesCommand(bot);
  registerPlaceholderCommands(bot);
  registerExpenseFlow(bot);
  registerFuelFlow(bot);
  registerServiceFlow(bot);
  registerUnknownMessageHandler(bot);

  bot.catch(async (error) => {
    console.error('Telegram bot error:', error.error);

    try {
      await error.ctx.reply('Что-то пошло не так. Попробуй еще раз.');
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  });

  return bot;
}

async function registerTelegramCommandMenu(bot: Bot): Promise<void> {
  await bot.api.setMyCommands(botCommandMenu);
}

function startReminderNotifications(bot: Bot, config: AppConfig): void {
  startReminderScheduler({
    intervalMinutes: config.reminderCheckIntervalMinutes,
    sender: createTelegramReminderNotificationSender(bot.api),
    onCheckComplete(result) {
      console.log(
        `Reminder check complete: checked=${result.checked}, due=${result.due}, sent=${result.sent}, failed=${result.failed}`
      );
    },
    onError(error, candidate) {
      console.error(`Failed to send reminder ${candidate.reminder.id}:`, error);
    }
  });
}

export async function startBot(): Promise<void> {
  const config = loadAppConfig();
  const bot = createBot(config);

  if (config.botMode === 'webhook') {
    throw new Error('BOT_MODE=webhook is reserved for deployment, but webhook mode is not implemented yet.');
  }

  startReminderNotifications(bot, config);
  await registerTelegramCommandMenu(bot);
  console.log('CarKeeper bot is starting with long polling.');
  await bot.start({
    drop_pending_updates: true
  });
}

export async function startBotWithConfig(config: AppConfig): Promise<void> {
  const bot = createBot(config);

  if (config.botMode === 'webhook') {
    throw new Error('BOT_MODE=webhook is reserved for deployment, but webhook mode is not implemented yet.');
  }

  startReminderNotifications(bot, config);
  await registerTelegramCommandMenu(bot);
  console.log('CarKeeper bot is starting with long polling.');
  await bot.start({
    drop_pending_updates: true
  });
}
