import nock from 'nock';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { CachedStationRouteService } from 'src/routing/services/cached-station-route.service';
import { CheckRideDistanceJob, RIDE_DISTANCE_CHECKS_QUEUE } from 'src/queue/queue-names';
import { CheckRideDistanceProcessor } from 'src/rides/jobs/check-ride-distance.processor';
import { Ride } from 'src/rides/entities/ride.entity';
import { Station } from 'src/stations/entities/station.entity';
import { StationRoute } from 'src/routing/entities/station-route.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { WorkerModule } from 'src/worker.module';
import { createRide, createStation, utc } from 'test/factories';
import { osrmRouteResponse } from 'test/helpers/fixtures';

describe('CheckRideDistanceProcessor', () => {
  let context: TestContext;
  let processor: CheckRideDistanceProcessor;

  beforeAll(async () => {
    context = await createTestContext();
    processor = new CheckRideDistanceProcessor(
      context.module.get(CachedStationRouteService),
      context.dataSource.getRepository(Ride),
      context.dataSource.getRepository(Station),
    );
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  function run(rideId: number): Promise<void> {
    return processor.process({ data: { rideId } } as Job<CheckRideDistanceJob>);
  }

  async function knownStations(): Promise<void> {
    await createStation(context.dataSource, { stationId: '021' });
    await createStation(context.dataSource, { stationId: '041' });
  }

  function reloadRide(rideId: number): Promise<Ride | null> {
    return context.dataSource.getRepository(Ride).findOne({ where: { rideId } });
  }

  it('runs on the ride distance queue', () => {
    const { providers } = WorkerModule.forQueue(RIDE_DISTANCE_CHECKS_QUEUE);

    expect(providers).toEqual([CheckRideDistanceProcessor]);
  });

  it('caches the bike route and stamps the ride as checked', async () => {
    await knownStations();
    nock('https://osrm.test').get(/.*/).reply(200, osrmRouteResponse());

    const ride = await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
    });

    await run(ride.rideId);

    expect((await reloadRide(ride.rideId))?.distanceCheckedAt).toBeInstanceOf(Date);
    expect(
      (await context.dataSource.getRepository(StationRoute).findOneByOrFail({ mode: 'bike' as never }))
        .distanceMeters,
    ).toBe(1502.3);
  });

  it('skips a ride whose distance was already checked', async () => {
    await knownStations();

    const ride = await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '041',
      distanceCheckedAt: utc('2026-01-01 00:00:00'),
    });

    await run(ride.rideId);

    expect(await context.dataSource.getRepository(StationRoute).count()).toBe(0);
    expect(nock.pendingMocks()).toEqual([]);
  });

  it('logs and leaves the ride unchecked when a station code is unknown', async () => {
    await createStation(context.dataSource, { stationId: '021' });

    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const ride = await createRide(context.dataSource, {
      originStationCode: '021',
      destinationStationCode: '999',
    });

    await run(ride.rideId);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('unknown station code(s) 021 / 999'));
    expect((await reloadRide(ride.rideId))?.distanceCheckedAt).toBeNull();
    expect(await context.dataSource.getRepository(StationRoute).count()).toBe(0);

    error.mockRestore();
  });
});
