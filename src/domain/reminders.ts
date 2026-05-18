export const reminderTypes = ['date', 'mileage', 'service', 'manual'] as const;
export const reminderStatuses = ['active', 'completed', 'dismissed'] as const;

export type ReminderType = (typeof reminderTypes)[number];
export type ReminderStatus = (typeof reminderStatuses)[number];

export type ReminderDueTarget = {
  dueDate: string | null;
  dueMileage: number | null;
};

export type ReminderRecord = ReminderDueTarget & {
  id: number;
  userId: number;
  carId: number;
  serviceEntryId: number | null;
  type: ReminderType;
  title: string;
  description: string | null;
  status: ReminderStatus;
  lastNotifiedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
