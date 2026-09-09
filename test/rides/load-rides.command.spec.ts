import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { LoadRidesCommand } from 'src/rides/commands/load-rides.command';
import { Ride } from 'src/rides/entities/ride.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { captureOutput } from 'test/helpers/capture-output';
import { createRide } from 'test/factories';

describe('rides:load', () => {
  let context: TestContext;
  let command: LoadRidesCommand;
  let directory: string;

  beforeAll(async () => {
    context = await createTestContext();
    command = context.module.get(LoadRidesCommand);
  });

  beforeEach(async () => {
    await context.reset();

    directory = mkdtempSync(join(tmpdir(), 'rides-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  afterAll(() => context.close());

  function ridePayload(id: number, checkoutTime: string): Record<string, unknown> {
    return {
      id,
      accountId: 123,
      status: 'Completed',
      duration: 8,
      bikeNumber: '5097',
      originStationCode: '021',
      originStation: '021- Driekoningen',
      originSlotId: '15',
      checkoutTime,
      destinationStationCode: '041',
      destinationStation: '041- Van Eyck',
      destinationSlotId: '23',
      checkinTime: checkoutTime,
    };
  }

  function writeExport(rides: unknown[]): string {
    const path = join(directory, 'rides.json');

    writeFileSync(path, JSON.stringify({ data: { CustomerRides: rides } }));

    return path;
  }

  function rides() {
    return context.dataSource.getRepository(Ride);
  }

  it('creates the rides from the export at the given path', async () => {
    const path = writeExport([ridePayload(1, '2026-01-01 08:00:00'), ridePayload(2, '2026-01-02 08:00:00')]);

    const output = await captureOutput(() => command.run([], { path }));

    expect(output).toContain('Loaded 2 rides (2 created, 0 updated).');
    expect(await rides().count()).toBe(2);
    expect((await rides().findOneByOrFail({ rideId: 1 })).checkoutTime.toISOString()).toBe(
      '2026-01-01T08:00:00.000Z',
    );
  });

  it('updates the rides it already knows about', async () => {
    await createRide(context.dataSource, { rideId: 1, status: 'InProgress' });

    const path = writeExport([ridePayload(1, '2026-01-01 08:00:00'), ridePayload(2, '2026-01-02 08:00:00')]);

    const output = await captureOutput(() => command.run([], { path }));

    expect(output).toContain('Loaded 2 rides (1 created, 1 updated).');
    expect((await rides().findOneByOrFail({ rideId: 1 })).status).toBe('Completed');
  });

  it('loads the bundled export when no path is given', async () => {
    await captureOutput(() => command.run([], {}));

    expect(await rides().count()).toBeGreaterThan(0);
  });
});
