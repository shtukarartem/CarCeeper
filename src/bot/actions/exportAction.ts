import { InputFile, type Context } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import {
  getExpenseReportSummary,
  getExpensesForExport
} from '../../db/repositories/reportRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatExpensesCsvWithBom } from '../../services/csvExportFormatter.js';
import { formatExpensesExcel } from '../../services/excelExportFormatter.js';
import { ReportPeriodParseError, parseReportPeriod } from '../../services/reportPeriodParser.js';
import { missingCarMessage } from '../messages.js';

type ExportFormat = 'csv' | 'xlsx';

type ExportCommandInput = {
  format: ExportFormat;
  periodInput: string;
};

function parseExportCommandInput(input: string | undefined): ExportCommandInput {
  const value = (input ?? '').trim();

  if (value === '') {
    return {
      format: 'csv',
      periodInput: ''
    };
  }

  const [firstToken, ...restTokens] = value.split(/\s+/);
  const normalizedFormat = firstToken.toLocaleLowerCase('ru-RU');

  if (normalizedFormat === 'csv') {
    return {
      format: 'csv',
      periodInput: restTokens.join(' ')
    };
  }

  if (normalizedFormat === 'excel' || normalizedFormat === 'xlsx') {
    return {
      format: 'xlsx',
      periodInput: restTokens.join(' ')
    };
  }

  return {
    format: 'csv',
    periodInput: value
  };
}

function getExportFileName(periodLabel: string, extension: 'csv' | 'xlsx'): string {
  const safePeriod = periodLabel
    .toLocaleLowerCase('ru-RU')
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-я0-9.-]+/giu, '');

  return `carkeeper-expenses-${safePeriod || 'export'}.${extension}`;
}

export async function sendExport(ctx: Context, input: string | undefined): Promise<void> {
  const from = ctx.from;

  if (!from) {
    await ctx.reply('Не удалось определить пользователя Telegram.');
    return;
  }

  const user = await upsertTelegramUser({
    telegramId: from.id,
    username: from.username,
    firstName: from.first_name
  });

  const activeCar = await getActiveCarByUserId(user.id);

  if (!activeCar) {
    await ctx.reply(missingCarMessage);
    return;
  }

  try {
    const exportInput = parseExportCommandInput(input);
    const period = parseReportPeriod(exportInput.periodInput);
    const reportQuery = {
      userId: user.id,
      carId: activeCar.id,
      startDate: period.startDate,
      endDate: period.endDate
    };
    const expenses = await getExpensesForExport(reportQuery);

    if (expenses.length === 0) {
      await ctx.reply('За выбранный период расходов для экспорта нет.');
      return;
    }

    if (exportInput.format === 'xlsx') {
      const summary = await getExpenseReportSummary(reportQuery, {
        dynamicsGroup: period.type === 'month' ? 'week' : 'month',
        topExpensesLimit: 5
      });
      const excelBuffer = await formatExpensesExcel({
        expenses,
        summary
      });
      const fileName = getExportFileName(period.label, 'xlsx');

      await ctx.replyWithDocument(
        new InputFile(excelBuffer, fileName),
        {
          caption: `Excel-экспорт расходов за ${period.label}`
        }
      );
      return;
    }

    const csv = formatExpensesCsvWithBom(expenses);
    const fileName = getExportFileName(period.label, 'csv');

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(csv, 'utf8'), fileName),
      {
        caption: `Экспорт расходов за ${period.label}`
      }
    );
  } catch (error) {
    if (error instanceof ReportPeriodParseError) {
      await ctx.reply(error.message);
      return;
    }

    throw error;
  }
}
