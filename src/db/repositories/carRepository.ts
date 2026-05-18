import { db } from '../client.js';

export type CarRecord = {
  id: number;
  userId: number;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  isActive: boolean;
  currentMileage: number | null;
  currentMileageUpdatedAt: Date | null;
};

type CarRow = {
  id: number;
  user_id: number;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  is_active: boolean;
  current_mileage: number | null;
  current_mileage_updated_at: Date | null;
};

function mapCar(row: CarRow): CarRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    make: row.make,
    model: row.model,
    year: row.year,
    isActive: row.is_active,
    currentMileage: row.current_mileage,
    currentMileageUpdatedAt: row.current_mileage_updated_at
  };
}

export async function getActiveCarByUserId(userId: number): Promise<CarRecord | null> {
  const result = await db.query<CarRow>(
    `
      select
        id,
        user_id,
        name,
        make,
        model,
        year,
        is_active,
        current_mileage,
        current_mileage_updated_at
      from cars
      where user_id = $1 and is_active = true
      limit 1
    `,
    [userId]
  );

  return result.rows[0] ? mapCar(result.rows[0]) : null;
}

export async function saveActiveCarForUser(userId: number, name: string): Promise<CarRecord> {
  const activeCar = await getActiveCarByUserId(userId);

  if (activeCar) {
    const result = await db.query<CarRow>(
      `
        update cars
        set name = $2,
            make = null,
            model = null,
            year = null,
            is_active = true
        where id = $1
        returning
          id,
          user_id,
          name,
          make,
          model,
          year,
          is_active,
          current_mileage,
          current_mileage_updated_at
      `,
      [activeCar.id, name]
    );

    return mapCar(result.rows[0]);
  }

  const result = await db.query<CarRow>(
    `
      insert into cars (user_id, name, is_active)
      values ($1, $2, true)
      returning
        id,
        user_id,
        name,
        make,
        model,
        year,
        is_active,
        current_mileage,
        current_mileage_updated_at
    `,
    [userId, name]
  );

  return mapCar(result.rows[0]);
}

export async function updateCarMileage(carId: number, mileage: number): Promise<CarRecord> {
  const result = await db.query<CarRow>(
    `
      update cars
      set current_mileage = $2,
          current_mileage_updated_at = current_timestamp
      where id = $1
      returning
        id,
        user_id,
        name,
        make,
        model,
        year,
        is_active,
        current_mileage,
        current_mileage_updated_at
    `,
    [carId, mileage]
  );

  return mapCar(result.rows[0]);
}
