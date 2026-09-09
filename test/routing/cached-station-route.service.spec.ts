import nock from 'nock';

import { CachedStationRouteService } from 'src/routing/services/cached-station-route.service';
import { Station } from 'src/stations/entities/station.entity';
import { StationRoute } from 'src/routing/entities/station-route.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';
import { createStation, createStationRoute } from 'test/factories';
import { osrmRouteResponse } from 'test/helpers/fixtures';

describe('CachedStationRouteService', () => {
  let context: TestContext;
  let service: CachedStationRouteService;
  let origin: Station;
  let destination: Station;

  beforeAll(async () => {
    context = await createTestContext();
    service = context.module.get(CachedStationRouteService);
  });

  beforeEach(async () => {
    await context.reset();

    origin = await createStation(context.dataSource, { stationId: '021', lat: 51.19548, lon: 4.41919 });
    destination = await createStation(context.dataSource, { stationId: '041', lat: 51.21797, lon: 4.40243 });
  });

  afterAll(() => context.close());

  function countRoutes(): Promise<number> {
    return context.dataSource.getRepository(StationRoute).count();
  }

  it('calculates and caches a route the first time it is asked for', async () => {
    nock('https://osrm.test').get(/.*/).reply(200, osrmRouteResponse());

    const route = await service.getRoute(origin, destination, TravelMode.Bike);

    expect(route.distanceMeters).toBe(1502.3);

    const cached = await context.dataSource.getRepository(StationRoute).findOneByOrFail({
      originStationId: '021',
      destinationStationId: '041',
      mode: TravelMode.Bike,
    });

    expect(cached.distanceMeters).toBe(1502.3);
    expect(cached.durationSeconds).toBe(361.7);
  });

  it('returns the cached route without calling the routing API again', async () => {
    await createStationRoute(context.dataSource, {
      originStationId: '021',
      destinationStationId: '041',
      mode: TravelMode.Bike,
      distanceMeters: 999.0,
      durationSeconds: 111.0,
    });

    const route = await service.getRoute(origin, destination, TravelMode.Bike);

    expect(route.distanceMeters).toBe(999.0);
    expect(route.durationSeconds).toBe(111.0);
    expect(nock.pendingMocks()).toEqual([]);
  });

  it('caches each travel mode separately', async () => {
    await createStationRoute(context.dataSource, {
      originStationId: '021',
      destinationStationId: '041',
      mode: TravelMode.Foot,
      distanceMeters: 999.0,
    });

    nock('https://osrm.test').get(/.*/).reply(200, osrmRouteResponse());

    const route = await service.getRoute(origin, destination, TravelMode.Bike);

    expect(route.distanceMeters).toBe(1502.3);
    expect(await countRoutes()).toBe(2);
  });
});
