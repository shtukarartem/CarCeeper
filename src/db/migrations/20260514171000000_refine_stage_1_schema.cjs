exports.up = (pgm) => {
  pgm.addColumn('cars', {
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
    }
  });

  pgm.createIndex('cars', 'user_id', {
    name: 'cars_one_active_car_per_user_idx',
    unique: true,
    where: 'is_active'
  });

  pgm.createIndex('expenses', ['user_id', 'created_at'], {
    name: 'expenses_user_created_at_idx',
    sort: {
      created_at: 'desc'
    }
  });

  pgm.sql(`
    create or replace function set_updated_at()
    returns trigger as $$
    begin
      new.updated_at = current_timestamp;
      return new;
    end;
    $$ language plpgsql;
  `);

  for (const tableName of ['users', 'cars', 'expenses']) {
    pgm.sql(`
      create trigger ${tableName}_set_updated_at
      before update on ${tableName}
      for each row
      execute function set_updated_at();
    `);
  }
};

exports.down = (pgm) => {
  for (const tableName of ['expenses', 'cars', 'users']) {
    pgm.sql(`drop trigger if exists ${tableName}_set_updated_at on ${tableName};`);
  }

  pgm.sql('drop function if exists set_updated_at();');

  pgm.dropIndex('expenses', ['user_id', 'created_at'], {
    name: 'expenses_user_created_at_idx'
  });

  pgm.dropIndex('cars', 'user_id', {
    name: 'cars_one_active_car_per_user_idx'
  });

  pgm.dropColumn('cars', 'is_active');
};
