import { Column, Entity, OneToMany, PrimaryColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

import { StationRoute } from 'src/routing/entities/station-route.entity';

@Entity({ name: 'stations' })
export class Station {
  @PrimaryColumn({ name: 'station_id', type: 'varchar', length: 32 })
  stationId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'short_name', type: 'varchar', length: 32 })
  shortName: string;

  @Column({ type: 'float' })
  lat: number;

  @Column({ type: 'float' })
  lon: number;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ name: 'post_code', type: 'varchar', length: 16 })
  postCode: string;

  @Column({ name: 'rental_methods', type: 'simple-json' })
  rentalMethods: string[];

  @Column({ type: 'integer', default: 0 })
  capacity: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => StationRoute, (route) => route.originStation)
  routesFrom: StationRoute[];

  @OneToMany(() => StationRoute, (route) => route.destinationStation)
  routesTo: StationRoute[];
}
