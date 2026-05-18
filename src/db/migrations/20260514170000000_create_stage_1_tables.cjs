const expenseCategories = [
  'fuel',
  'car_wash',
  'repair',
  'maintenance',
  'insurance',
  'parking',
  'fines',
  'parts',
  'tax',
  'other'
];

exports.up = (pgm) => {
  pgm.createType('expense_category', expenseCategories);

  pgm.createTable('users', {
    id: 'id',
    telegram_id: {
      type: 'bigint',
      notNull: true,
      unique: true
    },
    username: {
      type: 'varchar(255)'
    },
    first_name: {
      type: 'varchar(255)'
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

  pgm.createTable('cars', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    make: {
      type: 'varchar(120)'
    },
    model: {
      type: 'varchar(120)'
    },
    year: {
      type: 'integer'
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

  pgm.addConstraint('cars', 'cars_year_valid', {
    check: 'year is null or (year >= 1886 and year <= 2100)'
  });

  pgm.createIndex('cars', 'user_id');

  pgm.createTable('expenses', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    car_id: {
      type: 'integer',
      references: 'cars(id)',
      onDelete: 'set null'
    },
    category: {
      type: 'expense_category',
      notNull: true,
      default: 'other'
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
    comment: {
      type: 'text'
    },
    expense_date: {
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

  pgm.addConstraint('expenses', 'expenses_amount_positive', {
    check: 'amount > 0'
  });

  pgm.createIndex('expenses', 'user_id');
  pgm.createIndex('expenses', 'car_id');
  pgm.createIndex('expenses', ['user_id', 'expense_date']);
};

exports.down = (pgm) => {
  pgm.dropTable('expenses');
  pgm.dropTable('cars');
  pgm.dropTable('users');
  pgm.dropType('expense_category');
};
