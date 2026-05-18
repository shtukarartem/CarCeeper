exports.up = (pgm) => {
  pgm.addColumn('cars', {
    current_mileage: {
      type: 'integer'
    },
    current_mileage_updated_at: {
      type: 'timestamptz'
    }
  });

  pgm.addConstraint('cars', 'cars_current_mileage_non_negative', {
    check: 'current_mileage is null or current_mileage >= 0'
  });

  pgm.createTable('fuel_entries', {
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
    liters: {
      type: 'numeric(10,3)',
      notNull: true
    },
    amount: {
      type: 'numeric(12,2)',
      notNull: true
    },
    price_per_liter: {
      type: 'numeric(12,4)',
      notNull: true
    },
    mileage: {
      type: 'integer',
      notNull: true
    },
    fuel_date: {
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

  pgm.addConstraint('fuel_entries', 'fuel_entries_liters_positive', {
    check: 'liters > 0'
  });
  pgm.addConstraint('fuel_entries', 'fuel_entries_amount_positive', {
    check: 'amount > 0'
  });
  pgm.addConstraint('fuel_entries', 'fuel_entries_price_per_liter_positive', {
    check: 'price_per_liter > 0'
  });
  pgm.addConstraint('fuel_entries', 'fuel_entries_mileage_non_negative', {
    check: 'mileage >= 0'
  });

  pgm.createIndex('fuel_entries', 'user_id');
  pgm.createIndex('fuel_entries', 'car_id');
  pgm.createIndex('fuel_entries', 'expense_id');
  pgm.createIndex('fuel_entries', ['car_id', 'fuel_date'], {
    name: 'fuel_entries_car_fuel_date_idx'
  });
  pgm.createIndex('fuel_entries', ['car_id', 'mileage'], {
    name: 'fuel_entries_car_mileage_idx'
  });

  pgm.sql(`
    create trigger fuel_entries_set_updated_at
    before update on fuel_entries
    for each row
    execute function set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop trigger if exists fuel_entries_set_updated_at on fuel_entries;');

  pgm.dropIndex('fuel_entries', ['car_id', 'mileage'], {
    name: 'fuel_entries_car_mileage_idx'
  });
  pgm.dropIndex('fuel_entries', ['car_id', 'fuel_date'], {
    name: 'fuel_entries_car_fuel_date_idx'
  });
  pgm.dropIndex('fuel_entries', 'expense_id');
  pgm.dropIndex('fuel_entries', 'car_id');
  pgm.dropIndex('fuel_entries', 'user_id');

  pgm.dropTable('fuel_entries');

  pgm.dropConstraint('cars', 'cars_current_mileage_non_negative');
  pgm.dropColumn('cars', ['current_mileage', 'current_mileage_updated_at']);
};
