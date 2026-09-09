import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Ride } from 'src/rides/entities/ride.entity';

@Entity({ name: 'weather_records' })
export class WeatherRecord {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ name: 'ride_id', type: 'integer', unique: true })
  rideId: number;

  @Column({ name: 'temperature_c', type: 'float' })
  temperatureC: number;

  @Column({ name: 'apparent_temperature_c', type: 'float' })
  apparentTemperatureC: number;

  @Column({ name: 'precipitation_mm', type: 'float' })
  precipitationMm: number;

  @Column({ name: 'rain_mm', type: 'float' })
  rainMm: number;

  @Column({ name: 'snowfall_cm', type: 'float' })
  snowfallCm: number;

  @Column({ name: 'cloud_cover_percent', type: 'float' })
  cloudCoverPercent: number;

  @Column({ name: 'wind_speed_kmh', type: 'float' })
  windSpeedKmh: number;

  @Column({ name: 'wind_gusts_kmh', type: 'float' })
  windGustsKmh: number;

  @Column({ name: 'wind_direction_degrees', type: 'float' })
  windDirectionDegrees: number;

  @Column({ name: 'relative_humidity_percent', type: 'float' })
  relativeHumidityPercent: number;

  @Column({ name: 'weather_code', type: 'integer' })
  weatherCode: number;

  @Column({ name: 'observed_at', type: 'datetime' })
  observedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToOne(() => Ride, (ride) => ride.weather, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id', referencedColumnName: 'rideId' })
  ride: Ride;
}
