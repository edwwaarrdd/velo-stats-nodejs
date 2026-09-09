import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStationRoutesTable1757000000003 implements MigrationInterface {
  name = 'CreateStationRoutesTable1757000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "station_routes" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "origin_station_id" varchar(32) NOT NULL,
        "destination_station_id" varchar(32) NOT NULL,
        "mode" varchar(8) NOT NULL,
        "distance_meters" float NOT NULL,
        "duration_seconds" float NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_station_routes_origin_station" FOREIGN KEY ("origin_station_id")
          REFERENCES "stations" ("station_id") ON DELETE CASCADE,
        CONSTRAINT "FK_station_routes_destination_station" FOREIGN KEY ("destination_station_id")
          REFERENCES "stations" ("station_id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "unique_station_route_per_mode"
        ON "station_routes" ("origin_station_id", "destination_station_id", "mode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "unique_station_route_per_mode"`);
    await queryRunner.query(`DROP TABLE "station_routes"`);
  }
}
