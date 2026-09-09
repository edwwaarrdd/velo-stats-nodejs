import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ride } from 'src/rides/entities/ride.entity';
import { RideRouteSubquery } from 'src/rides/services/ride-route-subquery';
import { RideWithRoute } from 'src/rides/dto/ride.serializer';

interface RideRouteRow {
  distance_meters: number | null;
  expected_duration_seconds: number | null;
}

/**
 * Loads every ride together with its weather and the distance and expected ride
 * time of the cached bike route between its two stations.
 */
@Injectable()
export class RideListService {
  constructor(@InjectRepository(Ride) private readonly rides: Repository<Ride>) {}

  async list(): Promise<RideWithRoute[]> {
    const { entities, raw } = await this.rides
      .createQueryBuilder('rides')
      .leftJoinAndSelect('rides.weather', 'weather')
      .addSelect(RideRouteSubquery.distanceMeters(), 'distance_meters')
      .addSelect(RideRouteSubquery.expectedDurationSeconds(), 'expected_duration_seconds')
      .orderBy('rides.checkout_time', 'DESC')
      .addOrderBy('rides.ride_id', 'DESC')
      .getRawAndEntities<RideRouteRow>();

    return entities.map((ride, index) =>
      Object.assign(ride as RideWithRoute, {
        distanceMeters: nullableFloat(raw[index].distance_meters),
        expectedDurationSeconds: nullableFloat(raw[index].expected_duration_seconds),
      }),
    );
  }
}

function nullableFloat(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}
