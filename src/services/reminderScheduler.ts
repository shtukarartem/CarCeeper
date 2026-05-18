import {
  checkDueReminders,
  type ReminderCheckDependencies,
  type ReminderCheckResult
} from './reminderCheckService.js';

export type ReminderScheduler = {
  runNow(): Promise<ReminderCheckResult | null>;
  stop(): void;
};

export type StartReminderSchedulerInput = ReminderCheckDependencies & {
  intervalMinutes: number;
  runOnStart?: boolean;
  onCheckComplete?: (result: ReminderCheckResult) => void;
};

export function startReminderScheduler(input: StartReminderSchedulerInput): ReminderScheduler {
  let isRunning = false;
  const intervalMs = input.intervalMinutes * 60 * 1000;

  async function runNow(): Promise<ReminderCheckResult | null> {
    if (isRunning) {
      return null;
    }

    isRunning = true;

    try {
      const result = await checkDueReminders(input);
      input.onCheckComplete?.(result);
      return result;
    } catch (error) {
      console.error('Reminder check failed:', error);
      return null;
    } finally {
      isRunning = false;
    }
  }

  const interval = setInterval(() => {
    void runNow();
  }, intervalMs);

  if (input.runOnStart ?? true) {
    void runNow();
  }

  return {
    runNow,
    stop() {
      clearInterval(interval);
    }
  };
}
