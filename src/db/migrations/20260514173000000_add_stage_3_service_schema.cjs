exports.up = (pgm) => {
  pgm.createTable('service_entries', {
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
    expense_id: {
      type: 'integer',
      references: 'expenses(id)',
      onDelete: 'set null'
    },
    service_type: {
      type: 'varchar(80)',
      notNull: true
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true
    },
    currency: {
      type: 'char(3)',
      notNull: true,
      default: 'BYN'
    },
    service_mileage: {
      type: 'integer'
    },
    next_interval_km: {
      type: 'integer'
    },
    next_due_mileage: {
      type: 'integer'
    },
    next_interval_months: {
      type: 'integer'
    },
    next_due_date: {
      type: 'date'
    },
    comment: {
      type: 'text'
    },
    service_date: {
      type: 'date',
      notNull: true,
      default: pgm.func('current_date')
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

  pgm.addConstraint('service_entries', 'service_entries_amount_positive', {
    check: 'amount > 0'
  });
  pgm.addConstraint('service_entries', 'service_entries_service_mileage_non_negative', {
    check: 'service_mileage is null or service_mileage >= 0'
  });
  pgm.addConstraint('service_entries', 'service_entries_next_interval_km_positive', {
    check: 'next_interval_km is null or next_interval_km > 0'
  });
  pgm.addConstraint('service_entries', 'service_entries_next_due_mileage_non_negative', {
    check: 'next_due_mileage is null or next_due_mileage >= 0'
  });
  pgm.addConstraint('service_entries', 'service_entries_next_interval_months_positive', {
    check: 'next_interval_months is null or next_interval_months > 0'
  });
  pgm.addConstraint('service_entries', 'service_entries_service_type_not_blank', {
    check: "length(trim(service_type)) > 0"
  });
  pgm.addConstraint('service_entries', 'service_entries_title_not_blank', {
    check: "length(trim(title)) > 0"
  });

  pgm.createIndex('service_entries', 'user_id');
  pgm.createIndex('service_entries', 'car_id');
  pgm.createIndex('service_entries', 'expense_id');
  pgm.createIndex('service_entries', ['car_id', 'service_date'], {
    name: 'service_entries_car_service_date_idx'
  });
  pgm.createIndex('service_entries', ['car_id', 'next_due_mileage'], {
    name: 'service_entries_car_next_due_mileage_idx',
    where: 'next_due_mileage is not null'
  });
  pgm.createIndex('service_entries', ['car_id', 'next_due_date'], {
    name: 'service_entries_car_next_due_date_idx',
    where: 'next_due_date is not null'
  });

  pgm.sql(`
    create trigger service_entries_set_updated_at
    before update on service_entries
    for each row
    execute function set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop trigger if exists service_entries_set_updated_at on service_entries;');

  pgm.dropIndex('service_entries', ['car_id', 'next_due_date'], {
    name: 'service_entries_car_next_due_date_idx'
  });
  pgm.dropIndex('service_entries', ['car_id', 'next_due_mileage'], {
    name: 'service_entries_car_next_due_mileage_idx'
  });
  pgm.dropIndex('service_entries', ['car_id', 'service_date'], {
    name: 'service_entries_car_service_date_idx'
  });
  pgm.dropIndex('service_entries', 'expense_id');
  pgm.dropIndex('service_entries', 'car_id');
  pgm.dropIndex('service_entries', 'user_id');

  pgm.dropTable('service_entries');
};
