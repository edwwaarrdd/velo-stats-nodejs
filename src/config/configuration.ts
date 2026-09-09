import { join } from 'node:path';

/**
 * Every environment-driven setting the application reads, resolved once at
 * boot. Mirrors Laravel's config/services.php and the database and queue
 * connection settings.
 */
export interface AppConfiguration {
  port: number;
  corsAllowedOrigins: string[];
  database: {
    path: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  services: {
    veloAntwerpStationInformationUrl: string;
    osrmBaseUrl: string;
    openMeteoArchiveUrl: string;
    ridesJsonPath: string;
  };
}

export const projectRoot = join(__dirname, '..', '..');

function env(name: string, fallback: string): string {
  const value = process.env[name];

  return value === undefined || value === '' ? fallback : value;
}

export function configuration(): AppConfiguration {
  return {
    port: Number(env('PORT', '8000')),
    corsAllowedOrigins: env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== ''),
    database: {
      path: env('DB_DATABASE', join(projectRoot, 'database', 'database.sqlite')),
    },
    redis: {
      host: env('REDIS_HOST', '127.0.0.1'),
      port: Number(env('REDIS_PORT', '6379')),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    services: {
      veloAntwerpStationInformationUrl: env(
        'VELO_ANTWERP_STATION_INFORMATION_URL',
        'https://gbfs.smartbike.com/antwerp/1.0/en/station_information.json',
      ),
      osrmBaseUrl: env('OSRM_BASE_URL', 'https://routing.openstreetmap.de'),
      openMeteoArchiveUrl: env('OPEN_METEO_ARCHIVE_URL', 'https://archive-api.open-meteo.com/v1/archive'),
      ridesJsonPath: join(projectRoot, env('RIDES_JSON_PATH', 'data/rides.json')),
    },
  };
}
