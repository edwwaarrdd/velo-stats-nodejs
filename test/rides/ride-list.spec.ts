import request from 'supertest';

import { SerializedRide } from 'src/rides/dto/ride.serializer';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';
import { cacheBikeRoute, createRide, createWeatherRecord } from 'test/factories';

describe('GET /rides', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  async function results(): Promise<SerializedRide[]> {
    const response = await request(context.app.getHttpServer()).get('/rides');

    expect(response.status).toBe(200);

    return response.body.results;
  }

  it('returns an empty result list when there are no rides', async () => {
    const response = await request(context.app.getHttpServer()).get('/rides');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ results: [] });
  });

  it('returns rides most recent first', async () => {
    await createRide(context.dataSource, { rideId: 1, checkoutTime: '2026-01-01 08:00:00' });
    await createRide(context.dataSource, { rideId: 2, checkoutTime: '2026-03-01 08:00:00' });
    await createRide(context.dataSource, { rideId: 3, checkoutTime: '2026-02-01 08:00:00' });

    expect((await results()).map((ride) => ride.ride_id)).toEqual([2, 3, 1]);
  });

  it('returns every ride field, with distance, speed, expected ride time and weather', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1500.0, 400.0);

    const ride = await createRide(context.dataSource, {
      rideId: 73147208,
      accountId: 123,
      status: 'Completed',
      duration: 10,
      bikeNumber: '5097',
      originStationCode: '021',
      originStation: '021- Driekoningen',
      originSlotId: '15',
      checkoutTime: '2026-09-06 08:57:02',
      destinationStationCode: '041',
      destinationStation: '041- Van Eyck',
      destinationSlotId: '23',
      checkinTime: '2026-09-06 09:05:30',
    });

    await createWeatherRecord(context.dataSource, {
      rideId: ride.rideId,
      temperatureC: 18.0,
      apparentTemperatureC: 17.1,
      precipitationMm: 0.0,
      rainMm: 0.0,
      snowfallCm: 0.0,
      cloudCoverPercent: 42.0,
      windSpeedKmh: 11.2,
      windGustsKmh: 24.5,
      windDirectionDegrees: 210.0,
      relativeHumidityPercent: 68.0,
      weatherCode: 3,
      observedAt: '2026-09-06 09:00:00',
    });

    expect(await results()).toEqual([
      {
        ride_id: 73147208,
        account_id: 123,
        status: 'Completed',
        duration: 10,
        bike_number: '5097',
        origin_station_code: '021',
        origin_station: '021- Driekoningen',
        origin_slot_id: '15',
        checkout_time: '2026-09-06T08:57:02Z',
        destination_station_code: '041',
        destination_station: '041- Van Eyck',
        destination_slot_id: '23',
        checkin_time: '2026-09-06T09:05:30Z',
        distance_meters: 1500.0,
        speed_kmh: 10.63,
        expected_duration_seconds: 400.0,
        actual_duration_seconds: 508.0,
        duration_vs_expected_seconds: 108.0,
        weather: {
          temperature_c: 18.0,
          apparent_temperature_c: 17.1,
          precipitation_mm: 0.0,
          rain_mm: 0.0,
          snowfall_cm: 0.0,
          cloud_cover_percent: 42.0,
          wind_speed_kmh: 11.2,
          wind_gusts_kmh: 24.5,
          wind_direction_degrees: 210.0,
          relative_humidity_percent: 68.0,
          weather_code: 3,
          observed_at: '2026-09-06T09:00:00Z',
        },
      },
    ]);
  });

  it('returns a null distance and speed when no route is cached', async () => {
    await createRide(context.dataSource, { originStationCode: '021', destinationStationCode: '041' });

    const [result] = await results();

    expect(result.distance_meters).toBeNull();
    expect(result.speed_kmh).toBeNull();
    expect(result.expected_duration_seconds).toBeNull();
    expect(result.duration_vs_expected_seconds).toBeNull();
    expect(result.weather).toBeNull();
  });

  it('reports a negative delta when the ride beat the expected ride time', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1500.0, 400.0);
    await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
      checkoutTime: '2026-09-06 08:57:00',
      checkinTime: '2026-09-06 09:02:00',
    });

    const [result] = await results();

    // 300 seconds ridden against the 400 seconds the router predicted.
    expect(result.actual_duration_seconds).toBe(300.0);
    expect(result.duration_vs_expected_seconds).toBe(-100.0);
  });

  it('returns a null expected ride time when no route is cached', async () => {
    await createRide(context.dataSource, { originStationCode: '021', destinationStationCode: '999' });

    const [result] = await results();

    expect(result.expected_duration_seconds).toBeNull();
    expect(result.actual_duration_seconds).not.toBeNull();
    expect(result.duration_vs_expected_seconds).toBeNull();
  });

  it('ignores routes cached for another travel mode', async () => {
    const route = await cacheBikeRoute(context.dataSource, '021', '041', 1500.0);

    await context.dataSource.query('UPDATE station_routes SET mode = ? WHERE id = ?', [
      TravelMode.Foot,
      route.id,
    ]);
    await createRide(context.dataSource, { originStationCode: '021', destinationStationCode: '041' });

    const [result] = await results();

    expect(result.distance_meters).toBeNull();
  });

  it('returns a null speed when no time passed between check-out and check-in', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1500.0);
    await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
      checkoutTime: '2026-09-06 08:57:00',
      checkinTime: '2026-09-06 08:57:00',
    });

    const [result] = await results();

    expect(result.distance_meters).toBe(1500.0);
    expect(result.speed_kmh).toBeNull();
  });

  it('rounds the speed to two decimals', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 2345.0);
    await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
      checkoutTime: '2026-09-06 08:00:00',
      checkinTime: '2026-09-06 08:06:59',
    });

    // 2.345 km in 419 seconds is 20.14_ km/h.
    expect((await results())[0].speed_kmh).toBe(20.15);
  });

  it('bases the speed on the exact seconds rather than the rounded duration', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1742.4, 248.1);
    await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
      // The stored duration truncates 4m29s to 4 whole minutes, which would
      // overstate the speed as 26.14 km/h.
      duration: 4,
      checkoutTime: '2026-09-06 08:00:00',
      checkinTime: '2026-09-06 08:04:29',
    });

    expect((await results())[0].speed_kmh).toBe(23.32);
  });
});
