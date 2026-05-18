exports.up = (pgm) => {
  pgm.createIndex('reminders', ['user_id', 'created_at'], {
    name: 'reminders_user_created_at_idx'
  });
  pgm.createIndex('reminders', ['user_id', 'completed_at'], {
    name: 'reminders_user_completed_at_idx',
    where: 'completed_at is not null'
  });
  pgm.createIndex('reminders', ['car_id', 'completed_at'], {
    name: 'reminders_car_completed_at_idx',
    where: 'completed_at is not null'
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('reminders', ['car_id', 'completed_at'], {
    name: 'reminders_car_completed_at_idx'
  });
  pgm.dropIndex('reminders', ['user_id', 'completed_at'], {
    name: 'reminders_user_completed_at_idx'
  });
  pgm.dropIndex('reminders', ['user_id', 'created_at'], {
    name: 'reminders_user_created_at_idx'
  });
};
