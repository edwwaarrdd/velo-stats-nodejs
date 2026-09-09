import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Ride } from 'src/rides/entities/ride.entity';
import { Station } from 'src/stations/entities/station.entity';
import { StationRoute } from 'src/routing/entities/station-route.entity';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';

/**
 * Parses the "YYYY-MM-DD HH:mm:ss" literals the tests use as UTC, matching how
 * the ride export writes its times.
 */
export function utc(value: string): Date {
  return new Date(`${value.replace(' ', 'T')}Z`);
}

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? utc(value) : value;
}

export interface RideOverrides extends Partial<Omit<Ride, 'checkoutTime' | 'checkinTime' | 'weather'>> {
  checkoutTime?: Date | string;
  checkinTime?: Date | string;
}

export function makeRide(overrides: RideOverrides = {}): Ride {
  const checkoutTime = overrides.checkoutTime
    ? toDate(overrides.checkoutTime)
    : faker.date.recent({ days: 365 });
  const duration = overrides.duration ?? faker.number.int({ min: 3, max: 45 });
  const checkinTime = overrides.checkinTime
    ? toDate(overrides.checkinTime)
    : new Date(checkoutTime.getTime() + duration * 60_000);

  return Object.assign(new Ride(), {
    rideId: faker.number.int({ min: 1, max: 99_999_999 }),
    accountId: 123,
    status: 'Completed',
    bikeNumber: String(faker.number.int({ min: 1000, max: 9999 })),
    originStationCode: '021',
    originStation: '021- Driekoningen',
    originSlotId: String(faker.number.int({ min: 1, max: 30 })),
    destinationStationCode: '041',
    destinationStation: '041- Van Eyck',
    destinationSlotId: String(faker.number.int({ min: 1, max: 30 })),
    distanceCheckedAt: null,
    weatherCheckedAt: null,
    ...overrides,
    duration,
    checkoutTime,
    checkinTime,
  });
}

export function createRide(dataSource: DataSource, overrides: RideOverrides = {}): Promise<Ride> {
  return dataSource.getRepository(Ride).save(makeRide(overrides));
}

export function makeStation(overrides: Partial<Station> = {}): Station {
  const number = faker.number.int({ min: 1, max: 999 });
  const code = String(number).padStart(3, '0');

  return Object.assign(new Station(), {
    stationId: code,
    name: `${code}- ${faker.location.street()}`,
    shortName: code,
    lat: faker.location.latitude({ min: 51.15, max: 51.3 }),
    lon: faker.location.longitude({ min: 4.35, max: 4.5 }),
    address: faker.location.streetAddress(),
    postCode: String(faker.number.int({ min: 2000, max: 2660 })),
    rentalMethods: ['KEY', 'TRANSITCARD'],
    capacity: faker.number.int({ min: 10, max: 40 }),
    ...overrides,
  });
}

export function createStation(dataSource: DataSource, overrides: Partial<Station> = {}): Promise<Station> {
  return dataSource.getRepository(Station).save(makeStation(overrides));
}

/**
 * Creates a station only when that code is not stored yet, so a test can wire
 * several rides through the same pair of stations.
 */
export async function ensureStation(dataSource: DataSource, stationId: string): Promise<Station> {
  const repository = dataSource.getRepository(Station);
  const existing = await repository.findOne({ where: { stationId } });

  return existing ?? repository.save(makeStation({ stationId }));
}

export function makeStationRoute(overrides: Partial<StationRoute> = {}): StationRoute {
  return Object.assign(new StationRoute(), {
    mode: TravelMode.Bike,
    distanceMeters: faker.number.float({ min: 200, max: 5000, fractionDigits: 1 }),
    durationSeconds: faker.number.float({ min: 60, max: 1200, fractionDigits: 1 }),
    ...overrides,
  });
}

export async function createStationRoute(
  dataSource: DataSource,
  overrides: Partial<StationRoute> = {},
): Promise<StationRoute> {
  return dataSource.getRepository(StationRoute).save(makeStationRoute(overrides));
}

/**
 * Caches a bike route between two station codes, creating both stations first
 * so the foreign keys hold.
 */
export async function cacheBikeRoute(
  dataSource: DataSource,
  originCode: string,
  destinationCode: string,
  distanceMeters: number,
  durationSeconds = 300.0,
): Promise<StationRoute> {
  await ensureStation(dataSource, originCode);
  await ensureStation(dataSource, destinationCode);

  return createStationRoute(dataSource, {
    originStationId: originCode,
    destinationStationId: destinationCode,
    mode: TravelMode.Bike,
    distanceMeters,
    durationSeconds,
  });
}

export interface WeatherOverrides extends Partial<Omit<WeatherRecord, 'observedAt' | 'ride'>> {
  observedAt?: Date | string;
}

export function makeWeatherRecord(overrides: WeatherOverrides = {}): WeatherRecord {
  return Object.assign(new WeatherRecord(), {
    temperatureC: faker.number.float({ min: -5, max: 35, fractionDigits: 1 }),
    apparentTemperatureC: faker.number.float({ min: -10, max: 38, fractionDigits: 1 }),
    precipitationMm: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
    rainMm: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
    snowfallCm: 0.0,
    cloudCoverPercent: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    windSpeedKmh: faker.number.float({ min: 0, max: 60, fractionDigits: 1 }),
    windGustsKmh: faker.number.float({ min: 0, max: 90, fractionDigits: 1 }),
    windDirectionDegrees: faker.number.float({ min: 0, max: 359, fractionDigits: 1 }),
    relativeHumidityPercent: faker.number.float({ min: 20, max: 100, fractionDigits: 1 }),
    weatherCode: faker.helpers.arrayElement([0, 1, 2, 3, 61, 63, 80]),
    ...overrides,
    observedAt: overrides.observedAt ? toDate(overrides.observedAt) : faker.date.recent({ days: 365 }),
  });
}

export function createWeatherRecord(
  dataSource: DataSource,
  overrides: WeatherOverrides = {},
): Promise<WeatherRecord> {
  return dataSource.getRepository(WeatherRecord).save(makeWeatherRecord(overrides));
}
