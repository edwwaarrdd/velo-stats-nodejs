import nock from 'nock';

import { CachedRideWeatherService } from 'src/weather/services/cached-ride-weather.service';
import { Coordinate } from 'src/common/coordinate';
import { Ride } from 'src/rides/entities/ride.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';
import { createRide, createWeatherRecord } from 'test/factories';
import { openMeteoHourlyResponse } from 'test/helpers/fixtures';

describe('CachedRideWeatherService', () => {
  let context: TestContext;
  let service: CachedRideWeatherService;
  let ride: Ride;

  const antwerp = new Coordinate(51.19548, 4.41919);

  beforeAll(async () => {
    context = await createTestContext();
    service = context.module.get(CachedRideWeatherService);
  });

  beforeEach(async () => {
    await context.reset();

    ride = await createRide(context.dataSource, {
      checkoutTime: '2026-09-06 08:57:02',
      checkinTime: '2026-09-06 09:05:30',
    });
  });

  afterAll(() => context.close());

  function fakeArchive(temperature: number): void {
    nock('https://open-meteo.test')
      .get('/v1/archive')
      .query(true)
      .reply(200, openMeteoHourlyResponse(temperature));
  }

  function storedWeather(): Promise<WeatherRecord | null> {
    return context.dataSource.getRepository(WeatherRecord).findOne({ where: { rideId: ride.rideId } });
  }

  it('fetches and caches the weather at the ride checkin time', async () => {
    fakeArchive(18.0);

    const observation = await service.getWeather(ride, antwerp);

    expect(observation.temperatureC).toBe(18.0);

    const stored = await storedWeather();

    expect(stored?.temperatureC).toBe(18.0);
    expect(stored?.weatherCode).toBe(3);
  });

  it('returns the cached weather without calling the archive again', async () => {
    await createWeatherRecord(context.dataSource, { rideId: ride.rideId, temperatureC: 5.5 });

    const observation = await service.getWeather(ride, antwerp);

    expect(observation.temperatureC).toBe(5.5);
    expect(nock.pendingMocks()).toEqual([]);
  });

  it('refetches and replaces the cached weather when forced', async () => {
    await createWeatherRecord(context.dataSource, { rideId: ride.rideId, temperatureC: 5.5 });
    fakeArchive(18.0);

    const observation = await service.getWeather(ride, antwerp, true);

    expect(observation.temperatureC).toBe(18.0);
    expect(await context.dataSource.getRepository(WeatherRecord).countBy({ rideId: ride.rideId })).toBe(1);
    expect((await storedWeather())?.temperatureC).toBe(18.0);
  });
});
