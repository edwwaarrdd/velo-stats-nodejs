import 'reflect-metadata';
import { config as loadDotenv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { configuration } from 'src/config/configuration';
import { CreateRidesTable1757000000002 } from 'src/database/migrations/1757000000002-CreateRidesTable';
import { CreateStationRoutesTable1757000000003 } from 'src/database/migrations/1757000000003-CreateStationRoutesTable';
import { CreateStationsTable1757000000001 } from 'src/database/migrations/1757000000001-CreateStationsTable';
import { CreateWeatherRecordsTable1757000000004 } from 'src/database/migrations/1757000000004-CreateWeatherRecordsTable';
import { Ride } from 'src/rides/entities/ride.entity';
import { Station } from 'src/stations/entities/station.entity';
import { StationRoute } from 'src/routing/entities/station-route.entity';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';

loadDotenv();

export const entities = [Ride, Station, StationRoute, WeatherRecord];

/**
 * Migrations are listed rather than glob-loaded, so the compiled build and the
 * ts-node CLI always resolve exactly the same set in the same order.
 */
export const migrations = [
  CreateStationsTable1757000000001,
  CreateRidesTable1757000000002,
  CreateStationRoutesTable1757000000003,
  CreateWeatherRecordsTable1757000000004,
];

export function databaseOptions(databasePath?: string): DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: databasePath ?? configuration().database.path,
    entities,
    migrations,
    synchronize: false,
    // SQLite only honours foreign keys when they are switched on per connection.
    prepareDatabase: (db: { pragma: (source: string) => unknown }) => {
      db.pragma('foreign_keys = ON');
    },
  };
}

export default new DataSource(databaseOptions());
