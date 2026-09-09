import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeatherRecordsTable1757000000004 implements MigrationInterface {
  name = 'CreateWeatherRecordsTable1757000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "weather_records" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ride_id" integer NOT NULL,
        "temperature_c" float NOT NULL,
        "apparent_temperature_c" float NOT NULL,
        "precipitation_mm" float NOT NULL,
        "rain_mm" float NOT NULL,
        "snowfall_cm" float NOT NULL,
        "cloud_cover_percent" float NOT NULL,
        "wind_speed_kmh" float NOT NULL,
        "wind_gusts_kmh" float NOT NULL,
        "wind_direction_degrees" float NOT NULL,
        "relative_humidity_percent" float NOT NULL,
        "weather_code" integer NOT NULL,
        "observed_at" datetime NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "UQ_weather_records_ride_id" UNIQUE ("ride_id"),
        CONSTRAINT "FK_weather_records_ride" FOREIGN KEY ("ride_id")
          REFERENCES "rides" ("ride_id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "weather_records"`);
  }
}
