import nock from 'nock';

import { Coordinate } from 'src/common/coordinate';
import { OsrmRouteService } from 'src/routing/services/osrm-route.service';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';
import { osrmRouteResponse } from 'test/helpers/fixtures';

describe('OsrmRouteService', () => {
  let context: TestContext;
  let service: OsrmRouteService;

  const origin = new Coordinate(51.19548, 4.41919);
  const destination = new Coordinate(51.21797, 4.40243);

  beforeAll(async () => {
    context = await createTestContext();
    service = context.module.get(OsrmRouteService);
  });

  afterAll(() => context.close());

  it('returns the distance and duration of the first route', async () => {
    nock('https://osrm.test').get(/.*/).reply(200, osrmRouteResponse());

    const route = await service.getRoute(origin, destination, TravelMode.Bike);

    expect(route.distanceMeters).toBe(1502.3);
    expect(route.durationSeconds).toBe(361.7);
  });

  it('asks OSRM for the coordinates in lon,lat order', async () => {
    const scope = nock('https://osrm.test')
      .get('/routed-bike/route/v1/bike/4.41919,51.19548;4.40243,51.21797')
      .query({ overview: 'false' })
      .reply(200, osrmRouteResponse());

    await service.getRoute(origin, destination, TravelMode.Bike);

    expect(scope.isDone()).toBe(true);
  });

  it('asks a separate OSRM instance for each travel mode', async () => {
    const bike = nock('https://osrm.test')
      .get(/^\/routed-bike\//)
      .query(true)
      .reply(200, osrmRouteResponse());
    const foot = nock('https://osrm.test')
      .get(/^\/routed-foot\//)
      .query(true)
      .reply(200, osrmRouteResponse());

    await service.getRoute(origin, destination, TravelMode.Bike);
    await service.getRoute(origin, destination, TravelMode.Foot);

    expect(bike.isDone()).toBe(true);
    expect(foot.isDone()).toBe(true);
  });

  it('fails when OSRM cannot route between the coordinates', async () => {
    nock('https://osrm.test').get(/.*/).reply(200, { code: 'NoRoute', message: 'no route found' });

    await expect(
      service.getRoute(new Coordinate(0.0, 0.0), new Coordinate(1.0, 1.0), TravelMode.Bike),
    ).rejects.toThrow('OSRM request failed: no route found');
  });
});
