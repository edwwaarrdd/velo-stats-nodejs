import { Column, CreateDateColumn, Entity, Index, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { WeatherRecord } from 'src/weather/entities/weather-record.entity';

@Entity({ name: 'rides' })
export class Ride {
  @PrimaryColumn({ name: 'ride_id', type: 'integer' })
  rideId: number;

  @Column({ name: 'account_id', type: 'integer' })
  accountId: number;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ name: 'bike_number', type: 'varchar', length: 32 })
  bikeNumber: string;

  @Column({ name: 'origin_station_code', type: 'varchar', length: 32 })
  originStationCode: string;

  @Column({ name: 'origin_station', type: 'varchar' })
  originStation: string;

  @Column({ name: 'origin_slot_id', type: 'varchar', length: 16 })
  originSlotId: string;

  @Index()
  @Column({ name: 'checkout_time', type: 'datetime' })
  checkoutTime: Date;

  @Column({ name: 'destination_station_code', type: 'varchar', length: 32 })
  destinationStationCode: string;

  @Column({ name: 'destination_station', type: 'varchar' })
  destinationStation: string;

  @Column({ name: 'destination_slot_id', type: 'varchar', length: 16 })
  destinationSlotId: string;

  @Column({ name: 'checkin_time', type: 'datetime' })
  checkinTime: Date;

  @Column({ name: 'distance_checked_at', type: 'datetime', nullable: true })
  distanceCheckedAt: Date | null;

  @Column({ name: 'weather_checked_at', type: 'datetime', nullable: true })
  weatherCheckedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToOne(() => WeatherRecord, (weather) => weather.ride)
  weather: WeatherRecord | null;
}
