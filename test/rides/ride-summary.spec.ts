import request from 'supertest';

import { RideSummary } from 'src/rides/services/ride-summary-calculator.service';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { cacheBikeRoute, createRide } from 'test/factories';

describe('GET /rides/summary', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  async function summary(): Promise<RideSummary> {
    const response = await request(context.app.getHttpServer()).get('/rides/summary');

    expect(response.status).toBe(200);

    return response.body;
  }

  it('reports no statistics when there are no rides', async () => {
    expect(await summary()).toEqual({
      total_rides: 0,
      total_duration: null,
      average_duration: null,
      longest_ride_duration: null,
      shortest_ride_duration: null,
      total_distance_meters: null,
      average_distance_meters: null,
    });
  });

  it('aggregates duration and distance across every ride', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1500.0);
    await cacheBikeRoute(context.dataSource, '021', '076', 2500.0);

    await createRide(context.dataSource, {
      duration: 10,
      originStationCode: '021',
      destinationStationCode: '041',
    });
    await createRide(context.dataSource, {
      duration: 20,
      originStationCode: '021',
      destinationStationCode: '076',
    });
    await createRide(context.dataSource, {
      duration: 15,
      originStationCode: '021',
      destinationStationCode: '041',
    });

    expect(await summary()).toEqual({
      total_rides: 3,
      total_duration: 45,
      average_duration: 15.0,
      longest_ride_duration: 20,
      shortest_ride_duration: 10,
      total_distance_meters: 5500.0,
      average_distance_meters: 1833.33,
    });
  });

  it('averages distance over only the rides that have a cached route', async () => {
    await cacheBikeRoute(context.dataSource, '021', '041', 1500.0);

    await createRide(context.dataSource, {
      duration: 10,
      originStationCode: '021',
      destinationStationCode: '041',
    });
    await createRide(context.dataSource, {
      duration: 10,
      originStationCode: '021',
      destinationStationCode: '999',
    });

    const result = await summary();

    expect(result.total_rides).toBe(2);
    expect(result.total_distance_meters).toBe(1500.0);
    expect(result.average_distance_meters).toBe(1500.0);
  });

  it('reports null distances when no route is cached at all', async () => {
    await createRide(context.dataSource, { duration: 10 });

    const result = await summary();

    expect(result.total_distance_meters).toBeNull();
    expect(result.average_distance_meters).toBeNull();
    expect(result.total_duration).toBe(10);
  });

  it('rounds the average duration to two decimals', async () => {
    await createRide(context.dataSource, { duration: 10 });
    await createRide(context.dataSource, { duration: 11 });
    await createRide(context.dataSource, { duration: 11 });

    expect((await summary()).average_duration).toBe(10.67);
  });
});
