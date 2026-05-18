const reminderTypes = ['date', 'mileage', 'service', 'manual'];
const reminderStatuses = ['active', 'completed', 'dismissed'];

exports.up = (pgm) => {
  pgm.createType('reminder_type', reminderTypes);
  pgm.createType('reminder_status', reminderStatuses);

  pgm.createTable('reminders', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    car_id: {
      type: 'integer',
      notNull: true,
      references: 'cars(id)',
      onDelete: 'cascade'
    },
    service_entry_id: {
      type: 'integer',
      references: 'service_entries(id)',
      onDelete: 'cascade'
    },
    type: {
      type: 'reminder_type',
      notNull: true
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    due_date: {
      type: 'date'
    },
    due_mileage: {
      type: 'integer'
    },
    status: {
      type: 'reminder_status',
      notNull: true,
      default: 'active'
    },
    last_notified_at: {
      type: 'timestamptz'
    },
    completed_at: {
      type: 'timestamptz'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  pgm.addConstraint('reminders', 'reminders_title_not_blank', {
    check: "length(trim(title)) > 0"
  });
  pgm.addConstraint('reminders', 'reminders_due_target_present', {
    check: 'due_date is not null or due_mileage is not null'
  });
  pgm.addConstraint('reminders', 'reminders_due_mileage_non_negative', {
    check: 'due_mileage is null or due_mileage >= 0'
  });
  pgm.addConstraint('reminders', 'reminders_service_type_has_service_entry', {
    check: "type <> 'service' or service_entry_id is not null"
  });
  pgm.addConstraint('reminders', 'reminders_completed_at_matches_status', {
    check: "(status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null)"
  });

  pgm.createIndex('reminders', ['user_id', 'status'], {
    name: 'reminders_user_status_idx'
  });
  pgm.createIndex('reminders', ['car_id', 'status'], {
    name: 'reminders_car_status_idx'
  });
  pgm.createIndex('reminders', ['due_date'], {
    name: 'reminders_active_due_date_idx',
    where: "status = 'active' and due_date is not null"
  });
  pgm.createIndex('reminders', ['due_mileage'], {
    name: 'reminders_active_due_mileage_idx',
    where: "status = 'active' and due_mileage is not null"
  });
  pgm.createIndex('reminders', 'service_entry_id', {
    name: 'reminders_unique_service_entry_id_idx',
    unique: true,
    where: 'service_entry_id is not null'
  });

  pgm.sql(`
    create trigger reminders_set_updated_at
    before update on reminders
    for each row
    execute function set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop trigger if exists reminders_set_updated_at on reminders;');

  pgm.dropIndex('reminders', 'service_entry_id', {
    name: 'reminders_unique_service_entry_id_idx'
  });
  pgm.dropIndex('reminders', ['due_mileage'], {
    name: 'reminders_active_due_mileage_idx'
  });
  pgm.dropIndex('reminders', ['due_date'], {
    name: 'reminders_active_due_date_idx'
  });
  pgm.dropIndex('reminders', ['car_id', 'status'], {
    name: 'reminders_car_status_idx'
  });
  pgm.dropIndex('reminders', ['user_id', 'status'], {
    name: 'reminders_user_status_idx'
  });

  pgm.dropTable('reminders');
  pgm.dropType('reminder_status');
  pgm.dropType('reminder_type');
};
