import type { BotCommand } from 'grammy/types';

export const botCommandMenu: BotCommand[] = [
  { command: 'start', description: 'Начать работу' },
  { command: 'help', description: 'Список команд' },
  { command: 'examples', description: 'Примеры заполнения команд' },
  { command: 'menu', description: 'Кнопки для отчетов и экспорта' },
  { command: 'cancel', description: 'Отменить текущее действие' },
  { command: 'car', description: 'Добавить или изменить автомобиль' },
  { command: 'mileage', description: 'Обновить текущий пробег' },
  { command: 'add', description: 'Добавить расход' },
  { command: 'fuel', description: 'Добавить заправку' },
  { command: 'fuel_stats', description: 'Статистика топлива' },
  { command: 'service', description: 'Добавить обслуживание' },
  { command: 'services', description: 'История обслуживания' },
  { command: 'service_due', description: 'Ближайшие замены' },
  { command: 'remind', description: 'Добавить напоминание' },
  { command: 'todo', description: 'Ближайшие задачи' },
  { command: 'done', description: 'Отметить задачу выполненной' },
  { command: 'history', description: 'Последние расходы' },
  { command: 'today', description: 'Расходы за сегодня' },
  { command: 'stats', description: 'Статистика за месяц' },
  { command: 'report', description: 'Отчет за месяц или год' },
  { command: 'export', description: 'Экспорт CSV или Excel' },
  { command: 'undo', description: 'Удалить последнюю запись' },
  { command: 'categories', description: 'Категории расходов' }
];
