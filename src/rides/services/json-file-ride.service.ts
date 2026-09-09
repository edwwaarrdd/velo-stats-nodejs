import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'node:fs';

export interface RideAttributes {
  rideId: number;
  accountId: number;
  status: string;
  duration: number;
  bikeNumber: string;
  originStationCode: string;
  originStation: string;
  originSlotId: string;
  checkoutTime: Date;
  destinationStationCode: string;
  destinationStation: string;
  destinationSlotId: string;
  checkinTime: Date;
}

interface ExportedRide {
  id: number | string;
  accountId: number | string;
  status: string;
  duration: number | string;
  bikeNumber: string | number;
  originStationCode: string | number;
  originStation: string;
  originSlotId: string | number;
  checkoutTime: string;
  destinationStationCode: string | number;
  destinationStation: string;
  destinationSlotId: string | number;
  checkinTime: string;
}

interface RideExport {
  data: { CustomerRides: ExportedRide[] };
}

/**
 * Fetches ride history from a local JSON export of the customer rides.
 *
 * The export writes its checkout and checkin times as "Y-m-d H:i:s" in UTC,
 * with no offset of its own.
 */
@Injectable()
export class JsonFileRideService {
  constructor(private readonly path: string) {}

  fetchRides(): RideAttributes[] {
    if (!existsSync(this.path)) {
      throw new Error(`Rides export not found at ${this.path}.`);
    }

    const payload = JSON.parse(readFileSync(this.path, 'utf8')) as RideExport;

    return payload.data.CustomerRides.map((ride) => ({
      rideId: Number(ride.id),
      accountId: Number(ride.accountId),
      status: String(ride.status),
      duration: Number(ride.duration),
      bikeNumber: String(ride.bikeNumber),
      originStationCode: String(ride.originStationCode),
      originStation: String(ride.originStation),
      originSlotId: String(ride.originSlotId),
      checkoutTime: parseExportDateTime(ride.checkoutTime),
      destinationStationCode: String(ride.destinationStationCode),
      destinationStation: String(ride.destinationStation),
      destinationSlotId: String(ride.destinationSlotId),
      checkinTime: parseExportDateTime(ride.checkinTime),
    }));
  }
}

function parseExportDateTime(value: string): Date {
  const parsed = new Date(`${value.replace(' ', 'T')}Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Unparseable ride timestamp "${value}".`);
  }

  return parsed;
}
