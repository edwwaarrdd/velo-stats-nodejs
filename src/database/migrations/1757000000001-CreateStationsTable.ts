import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStationsTable1757000000001 implements MigrationInterface {
  name = 'CreateStationsTable1757000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stations" (
        "station_id" varchar(32) NOT NULL PRIMARY KEY,
        "name" varchar NOT NULL,
        "short_name" varchar(32) NOT NULL,
        "lat" float NOT NULL,
        "lon" float NOT NULL,
        "address" varchar NOT NULL,
        "post_code" varchar(16) NOT NULL,
        "rental_methods" text NOT NULL,
        "capacity" integer NOT NULL DEFAULT (0),
        "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stations"`);
  }
}
