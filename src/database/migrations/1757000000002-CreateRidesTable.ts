import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRidesTable1757000000002 implements MigrationInterface {
  name = 'CreateRidesTable1757000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "rides" (
        "ride_id" integer NOT NULL PRIMARY KEY,
        "account_id" integer NOT NULL,
        "status" varchar(32) NOT NULL,
        "duration" integer NOT NULL,
        "bike_number" varchar(32) NOT NULL,
        "origin_station_code" varchar(32) NOT NULL,
        "origin_station" varchar NOT NULL,
        "origin_slot_id" varchar(16) NOT NULL,
        "checkout_time" datetime NOT NULL,
        "destination_station_code" varchar(32) NOT NULL,
        "destination_station" varchar NOT NULL,
        "destination_slot_id" varchar(16) NOT NULL,
        "checkin_time" datetime NOT NULL,
        "distance_checked_at" datetime,
        "weather_checked_at" datetime,
        "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_rides_checkout_time" ON "rides" ("checkout_time")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_rides_checkout_time"`);
    await queryRunner.query(`DROP TABLE "rides"`);
  }
}
