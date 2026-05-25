import type { Bot } from 'grammy';
import { ServiceParseError, parseServiceInput } from '../../services/serviceParser.js';
import { createServiceFromParsedInput } from '../actions/serviceAction.js';
import { clearUserFlowState, getUserFlowState, setUserFlowState } from './flowState.js';

const amountPattern = /^-?\d+(?:[.,]\d{1,2})?$/;
const integerPattern = /^-?\d+$/;
const skipTokens = new Set(['-', 'нет', 'пропустить']);

function isSkip(value: string): boolean {
  return skipTokens.has(value.trim().toLocaleLowerCase('ru-RU'));
}

function parsePositiveAmount(value: string): number | null {
  const trimmedValue = value.trim();

  if (!amountPattern.test(trimmedValue)) {
    return null;
  }

  const amount = Number(trimmedValue.replace(',', '.'));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function parseOptionalNonNegativeInteger(value: string): number | null | undefined {
  const trimmedValue = value.trim();

  if (isSkip(trimmedValue)) {
    return null;
  }

  if (!integerPattern.test(trimmedValue)) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return undefined;
  }

  return parsedValue;
}

function parseOptionalPositiveInteger(value: string): number | null | undefined {
  const trimmedValue = value.trim();

  if (isSkip(trimmedValue)) {
    return null;
  }

  if (!integerPattern.test(trimmedValue)) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

function buildServiceInput(data: {
  title: string;
  amount: number;
  serviceMileage: number | null;
  nextIntervalKm: number | null;
  nextIntervalMonths: number | null;
}): string {
  const parts = [data.title, String(data.amount)];

  if (data.serviceMileage !== null) {
    parts.push('пробег', String(data.serviceMileage));
  }

  if (data.nextIntervalKm !== null) {
    parts.push('след', String(data.nextIntervalKm));
  }

  if (data.nextIntervalMonths !== null) {
    parts.push('след', String(data.nextIntervalMonths), 'месяцев');
  }

  return parts.join(' ');
}

export function registerServiceFlow(bot: Bot): void {
  bot.callbackQuery('menu:service:start', async (ctx) => {
    await ctx.answerCallbackQuery();

    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    setUserFlowState(userId, {
      type: 'service',
      step: 'title',
      data: {}
    });

    await ctx.reply([
      'Добавление обслуживания.',
      'Что обслуживали?',
      'Например: масло',
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

    if (!state || state.type !== 'service') {
      await next();
      return;
    }

    const text = ctx.message.text.trim();

    if (text.startsWith('/')) {
      await ctx.reply('Заверши текущее действие или отмени его командой /cancel.');
      return;
    }

    if (state.step === 'title') {
      if (text.length === 0) {
        await ctx.reply('Название обслуживания не должно быть пустым. Например: масло');
        return;
      }

      setUserFlowState(userId, {
        type: 'service',
        step: 'amount',
        data: {
          title: text
        }
      });
      await ctx.reply('Какая сумма? Например: 6200');
      return;
    }

    if (state.step === 'amount') {
      const amount = parsePositiveAmount(text);

      if (amount === null) {
        await ctx.reply('Сумма должна быть числом больше нуля. Например: 6200');
        return;
      }

      setUserFlowState(userId, {
        type: 'service',
        step: 'serviceMileage',
        data: {
          ...state.data,
          amount
        }
      });
      await ctx.reply('Пробег обслуживания? Можно пропустить: -');
      return;
    }

    if (state.step === 'serviceMileage') {
      const serviceMileage = parseOptionalNonNegativeInteger(text);

      if (serviceMileage === undefined) {
        await ctx.reply('Пробег должен быть целым неотрицательным числом. Например: 126000 или -');
        return;
      }

      setUserFlowState(userId, {
        type: 'service',
        step: 'nextIntervalKm',
        data: {
          ...state.data,
          serviceMileage
        }
      });
      await ctx.reply('Через сколько км следующая замена? Можно пропустить: -');
      return;
    }

    if (state.step === 'nextIntervalKm') {
      const nextIntervalKm = parseOptionalPositiveInteger(text);

      if (nextIntervalKm === undefined) {
        await ctx.reply('Интервал в км должен быть целым числом больше нуля. Например: 8000 или -');
        return;
      }

      setUserFlowState(userId, {
        type: 'service',
        step: 'nextIntervalMonths',
        data: {
          ...state.data,
          nextIntervalKm
        }
      });
      await ctx.reply('Через сколько месяцев следующая замена? Можно пропустить: -');
      return;
    }

    const nextIntervalMonths = parseOptionalPositiveInteger(text);

    if (nextIntervalMonths === undefined) {
      await ctx.reply('Интервал в месяцах должен быть целым числом больше нуля. Например: 24 или -');
      return;
    }

    try {
      const parsedService = parseServiceInput(buildServiceInput({
        ...state.data,
        nextIntervalMonths
      }));

      clearUserFlowState(userId);
      await createServiceFromParsedInput(ctx, parsedService);
    } catch (error) {
      if (error instanceof ServiceParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
