import nock from 'nock';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { CachedRideWeatherService } from 'src/weather/services/cached-ride-weather.service';
import { CheckRideWeatherJob, RIDE_WEATHER_CHECKS_QUEUE } from 'src/queue/queue-names';
import { CheckRideWeatherProcessor } from 'src/weather/jobs/check-ride-weather.processor';
import { Ride } from 'src/rides/entities/ride.entity';
import { RideOverrides, createRide, createStation, createWeatherRecord, utc } from 'test/factories';
import { Station } from 'src/stations/entities/station.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';
import { WorkerModule } from 'src/worker.module';
import { openMeteoHourlyResponse } from 'test/helpers/fixtures';

describe('CheckRideWeatherProcessor', () => {
  let context: TestContext;
  let processor: CheckRideWeatherProcessor;

  beforeAll(async () => {
    context = await createTestContext();
    processor = new CheckRideWeatherProcessor(
      context.module.get(CachedRideWeatherService),
      context.dataSource.getRepository(Ride),
      context.dataSource.getRepository(Station),
    );
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  function run(rideId: number, force = false): Promise<void> {
    return processor.process({ data: { rideId, force } } as Job<CheckRideWeatherJob>);
  }

  function fakeOpenMeteo(temperature = 18.0): void {
    nock('https://open-meteo.test')
      .get('/v1/archive')
      .query(true)
      .reply(200, openMeteoHourlyResponse(temperature));
  }

  function rideOn6September(overrides: RideOverrides = {}): Promise<Ride> {
    return createRide(context.dataSource, {
      originStationCode: '021',
      checkoutTime: '2026-09-06 08:57:02',
      checkinTime: '2026-09-06 09:05:30',
      ...overrides,
    });
  }

  function storedWeather(rideId: number): Promise<WeatherRecord | null> {
    return context.dataSource.getRepository(WeatherRecord).findOne({ where: { rideId } });
  }

  function reloadRide(rideId: number): Promise<Ride | null> {
    return context.dataSource.getRepository(Ride).findOne({ where: { rideId } });
  }

  it('runs on the ride weather queue', () => {
    const { providers } = WorkerModule.forQueue(RIDE_WEATHER_CHECKS_QUEUE);

    expect(providers).toEqual([CheckRideWeatherProcessor]);
  });

  it('caches the weather and stamps the ride as checked', async () => {
    await createStation(context.dataSource, { stationId: '021' });
    fakeOpenMeteo();

    const ride = await rideOn6September();

    await run(ride.rideId);

    expect((await reloadRide(ride.rideId))?.weatherCheckedAt).toBeInstanceOf(Date);
    expect((await storedWeather(ride.rideId))?.temperatureC).toBe(18.0);
  });

  it('skips a ride whose weather was already checked', async () => {
    await createStation(context.dataSource, { stationId: '021' });

    const ride = await rideOn6September({ weatherCheckedAt: utc('2026-01-01 00:00:00') });

    await run(ride.rideId);

    expect(await context.dataSource.getRepository(WeatherRecord).count()).toBe(0);
    expect(nock.pendingMocks()).toEqual([]);
  });

  it('refetches the weather of an already checked ride when forced', async () => {
    await createStation(context.dataSource, { stationId: '021' });
    fakeOpenMeteo(21.5);

    const ride = await rideOn6September({ weatherCheckedAt: utc('2026-01-01 00:00:00') });

    await createWeatherRecord(context.dataSource, { rideId: ride.rideId, temperatureC: 5.5 });

    await run(ride.rideId, true);

    expect((await storedWeather(ride.rideId))?.temperatureC).toBe(21.5);
  });

  it('logs and leaves the ride unchecked when the origin station is unknown', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const ride = await rideOn6September({ originStationCode: '999' });

    await run(ride.rideId);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('unknown origin station code 999'));
    expect((await reloadRide(ride.rideId))?.weatherCheckedAt).toBeNull();
    expect(await context.dataSource.getRepository(WeatherRecord).count()).toBe(0);

    error.mockRestore();
  });
});
