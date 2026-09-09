import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { JsonFileRideService } from 'src/rides/services/json-file-ride.service';

describe('JsonFileRideService', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'rides-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function writeExport(rides: unknown[]): string {
    const path = join(directory, 'rides.json');

    writeFileSync(path, JSON.stringify({ data: { CustomerRides: rides } }));

    return path;
  }

  it('maps the ride export onto ride attributes', () => {
    const path = writeExport([
      {
        id: 73147208,
        accountId: 123,
        status: 'Completed',
        duration: 8,
        bikeNumber: '5097',
        originStationCode: '021',
        originStation: '021- Driekoningen',
        originSlotId: '15',
        checkoutTime: '2026-09-06 08:57:02',
        destinationStationCode: '041',
        destinationStation: '041- Van Eyck',
        destinationSlotId: '23',
        checkinTime: '2026-09-06 09:05:30',
      },
    ]);

    const [ride] = new JsonFileRideService(path).fetchRides();

    expect(ride).toEqual({
      rideId: 73147208,
      accountId: 123,
      status: 'Completed',
      duration: 8,
      bikeNumber: '5097',
      originStationCode: '021',
      originStation: '021- Driekoningen',
      originSlotId: '15',
      checkoutTime: new Date('2026-09-06T08:57:02Z'),
      destinationStationCode: '041',
      destinationStation: '041- Van Eyck',
      destinationSlotId: '23',
      checkinTime: new Date('2026-09-06T09:05:30Z'),
    });
  });

  it('reads the export times as UTC', () => {
    const path = writeExport([
      {
        id: 1,
        accountId: 1,
        status: 'Completed',
        duration: 5,
        bikeNumber: '1',
        originStationCode: '021',
        originStation: 'a',
        originSlotId: '1',
        checkoutTime: '2026-01-01 08:00:00',
        destinationStationCode: '041',
        destinationStation: 'b',
        destinationSlotId: '2',
        checkinTime: '2026-01-01 08:05:00',
      },
    ]);

    const [ride] = new JsonFileRideService(path).fetchRides();

    expect(ride.checkoutTime.toISOString()).toBe('2026-01-01T08:00:00.000Z');
  });

  it('keeps the rides in export order', () => {
    const path = writeExport(
      [1, 2].map((id) => ({
        id,
        accountId: 1,
        status: 'Completed',
        duration: 5,
        bikeNumber: '1',
        originStationCode: '021',
        originStation: 'a',
        originSlotId: '1',
        checkoutTime: `2026-01-0${id} 08:00:00`,
        destinationStationCode: '041',
        destinationStation: 'b',
        destinationSlotId: '2',
        checkinTime: `2026-01-0${id} 08:05:00`,
      })),
    );

    expect(new JsonFileRideService(path).fetchRides().map((ride) => ride.rideId)).toEqual([1, 2]);
  });

  it('fails when the export is missing', () => {
    expect(() => new JsonFileRideService('/nowhere/rides.json').fetchRides()).toThrow(
      'Rides export not found at /nowhere/rides.json.',
    );
  });
});
