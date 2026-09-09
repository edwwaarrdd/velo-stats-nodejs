import nock from 'nock';

import { Coordinate } from 'src/common/coordinate';
import { OpenMeteoWeatherService } from 'src/weather/services/open-meteo-weather.service';
import { TestContext, createTestContext } from 'test/helpers/test-app';

const ARCHIVE_RESPONSE = {
  hourly: {
    time: ['2026-09-06T08:00', '2026-09-06T09:00'],
    temperature_2m: [17.2, 18.0],
    apparent_temperature: [16.4, 17.1],
    precipitation: [0.0, 0.2],
    rain: [0.0, 0.2],
    snowfall: [0.0, 0.0],
    cloud_cover: [30.0, 42.0],
    wind_speed_10m: [9.8, 11.2],
    wind_gusts_10m: [20.1, 24.5],
    wind_direction_10m: [200.0, 210.0],
    relative_humidity_2m: [72.0, 68.0],
    weather_code: [1, 3],
  },
};

describe('OpenMeteoWeatherService', () => {
  let context: TestContext;
  let service: OpenMeteoWeatherService;

  const antwerp = new Coordinate(51.19548, 4.41919);

  beforeAll(async () => {
    context = await createTestContext();
    service = context.module.get(OpenMeteoWeatherService);
  });

  afterAll(() => context.close());

  it('returns the observation for the hour of the given time', async () => {
    nock('https://open-meteo.test').get('/v1/archive').query(true).reply(200, ARCHIVE_RESPONSE);

    const observation = await service.getWeather(antwerp, new Date('2026-09-06T09:05:30Z'));

    expect(observation.temperatureC).toBe(18.0);
    expect(observation.apparentTemperatureC).toBe(17.1);
    expect(observation.precipitationMm).toBe(0.2);
    expect(observation.rainMm).toBe(0.2);
    expect(observation.snowfallCm).toBe(0.0);
    expect(observation.cloudCoverPercent).toBe(42.0);
    expect(observation.windSpeedKmh).toBe(11.2);
    expect(observation.windGustsKmh).toBe(24.5);
    expect(observation.windDirectionDegrees).toBe(210.0);
    expect(observation.relativeHumidityPercent).toBe(68.0);
    expect(observation.weatherCode).toBe(3);
    expect(observation.observedAt.toISOString()).toBe('2026-09-06T09:00:00.000Z');
  });

  it('asks the archive for the observation date in UTC', async () => {
    const scope = nock('https://open-meteo.test')
      .get('/v1/archive')
      .query(
        (query) =>
          query.start_date === '2026-09-06' &&
          query.end_date === '2026-09-06' &&
          query.timezone === 'UTC' &&
          String(query.hourly).includes('apparent_temperature'),
      )
      .reply(200, ARCHIVE_RESPONSE);

    await service.getWeather(antwerp, new Date('2026-09-06T09:05:30Z'));

    expect(scope.isDone()).toBe(true);
  });

  it('fails when the archive returns no hourly data', async () => {
    nock('https://open-meteo.test').get('/v1/archive').query(true).reply(200, { reason: 'out of range' });

    await expect(
      service.getWeather(new Coordinate(0.0, 0.0), new Date('2026-09-06T09:05:30Z')),
    ).rejects.toThrow('Open-Meteo request failed: out of range');
  });

  it('fails when the archive has no observation for the hour', async () => {
    nock('https://open-meteo.test').get('/v1/archive').query(true).reply(200, ARCHIVE_RESPONSE);

    await expect(
      service.getWeather(new Coordinate(0.0, 0.0), new Date('2026-09-06T23:05:30Z')),
    ).rejects.toThrow('Open-Meteo response has no observation for 2026-09-06T23:00.');
  });
});
