import type { Bot } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import {
  type ExpenseReportSummary,
  getExpenseReportSummary,
  getReportFuelMileagePoints
} from '../../db/repositories/reportRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { calculateOwnershipCostPerKm } from '../../services/ownershipCostPerKmCalculator.js';
import { formatMonthlyReport, formatYearlyReport } from '../../services/reportFormatter.js';
import { ReportPeriodParseError, parseReportPeriod } from '../../services/reportPeriodParser.js';
import { missingCarMessage } from '../messages.js';

function getFuelAmount(summary: ExpenseReportSummary): number {
  return summary.byCategory.find((item) => item.category === 'fuel')?.amount ?? 0;
}

export function registerReportCommand(bot: Bot): void {
  bot.command('report', async (ctx) => {
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
      const period = parseReportPeriod(ctx.match);

      const reportQuery = {
        userId: user.id,
        carId: activeCar.id,
        startDate: period.startDate,
        endDate: period.endDate
      };
      const [summary, mileagePoints] = await Promise.all([
        getExpenseReportSummary(
          reportQuery,
          {
            dynamicsGroup: period.type === 'month' ? 'week' : 'month',
            topExpensesLimit: 5
          }
        ),
        getReportFuelMileagePoints(reportQuery)
      ]);
      const costPerKm = calculateOwnershipCostPerKm({
        totalAmount: summary.totalAmount,
        fuelAmount: getFuelAmount(summary),
        mileagePoints: mileagePoints.map((point) => point.mileage)
      });

      const response = period.type === 'month'
        ? formatMonthlyReport({
            periodLabel: period.label,
            carName: activeCar.name,
            summary,
            costPerKm
          })
        : formatYearlyReport({
            periodLabel: period.label,
            carName: activeCar.name,
            summary,
            costPerKm
          });

      await ctx.reply(response);
    } catch (error) {
      if (error instanceof ReportPeriodParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
