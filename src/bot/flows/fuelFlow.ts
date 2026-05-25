import type { Bot } from 'grammy';
import { assertValidMileage } from '../../domain/mileage.js';
import type { ParsedFuelInput } from '../../services/fuelParser.js';
import { createFuelFromParsedInput } from '../actions/fuelAction.js';
import { clearUserFlowState, getUserFlowState, setUserFlowState } from './flowState.js';

const decimalNumberPattern = /^-?\d+(?:[.,]\d+)?$/;
const integerPattern = /^-?\d+$/;

function parsePositiveDecimal(value: string): number | null {
  if (!decimalNumberPattern.test(value.trim())) {
    return null;
  }

  const parsedValue = Number(value.trim().replace(',', '.'));

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function parseMileage(value: string): number | null {
  const trimmedValue = value.trim();

  if (!integerPattern.test(trimmedValue)) {
    return null;
  }

  try {
    return assertValidMileage(Number(trimmedValue));
  } catch {
    return null;
  }
}

export function registerFuelFlow(bot: Bot): void {
  bot.callbackQuery('menu:fuel:start', async (ctx) => {
    await ctx.answerCallbackQuery();

    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    setUserFlowState(userId, {
      type: 'fuel',
      step: 'liters',
      data: {}
    });

    await ctx.reply([
      'Добавление заправки.',
      'Сколько литров?',
      'Например: 45',
      '',
      'Отмена: /cancel'
    ].join('\n'));
  });

  bot.on('message:text', async (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await next();
      return;
    }

    const state = getUserFlowState(userId);

    if (!state || state.type !== 'fuel') {
      await next();
      return;
    }

    const text = ctx.message.text.trim();

    if (text.startsWith('/')) {
      await ctx.reply('Заверши текущее действие или отмени его командой /cancel.');
      return;
    }

    if (state.step === 'liters') {
      const liters = parsePositiveDecimal(text);

      if (liters === null) {
        await ctx.reply('Литры должны быть числом больше нуля. Например: 45');
        return;
      }

      setUserFlowState(userId, {
        type: 'fuel',
        step: 'amount',
        data: {
          liters
        }
      });
      await ctx.reply('Какая сумма? Например: 3200');
      return;
    }

    if (state.step === 'amount') {
      const amount = parsePositiveDecimal(text);

      if (amount === null) {
        await ctx.reply('Сумма должна быть числом больше нуля. Например: 3200');
        return;
      }

      setUserFlowState(userId, {
        type: 'fuel',
        step: 'mileage',
        data: {
          ...state.data,
          amount
        }
      });
      await ctx.reply('Какой пробег? Например: 124500');
      return;
    }

    const mileage = parseMileage(text);

    if (mileage === null) {
      await ctx.reply('Пробег должен быть целым неотрицательным числом. Например: 124500');
      return;
    }

    const parsedFuel: ParsedFuelInput = {
      liters: state.data.liters,
      amount: state.data.amount,
      mileage,
      pricePerLiter: state.data.amount / state.data.liters
    };

    clearUserFlowState(userId);
    await createFuelFromParsedInput(ctx, parsedFuel);
  });
}
