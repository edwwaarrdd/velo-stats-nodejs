import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Station } from 'src/stations/entities/station.entity';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';

@Entity({ name: 'station_routes' })
@Index('unique_station_route_per_mode', ['originStationId', 'destinationStationId', 'mode'], { unique: true })
export class StationRoute {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ name: 'origin_station_id', type: 'varchar', length: 32 })
  originStationId: string;

  @Column({ name: 'destination_station_id', type: 'varchar', length: 32 })
  destinationStationId: string;

  @Column({ type: 'varchar', length: 8 })
  mode: TravelMode;

  @Column({ name: 'distance_meters', type: 'float' })
  distanceMeters: number;

  @Column({ name: 'duration_seconds', type: 'float' })
  durationSeconds: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Station, (station) => station.routesFrom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'origin_station_id', referencedColumnName: 'stationId' })
  originStation: Station;

  @ManyToOne(() => Station, (station) => station.routesTo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destination_station_id', referencedColumnName: 'stationId' })
  destinationStation: Station;
}
