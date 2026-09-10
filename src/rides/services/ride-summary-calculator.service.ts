import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { RideRouteSubquery } from 'src/rides/services/ride-route-subquery';
import { roundMoney } from 'src/common/round';

export interface RideSummary {
  total_rides: number;
  total_duration: number | null;
  average_duration: number | null;
  longest_ride_duration: number | null;
  shortest_ride_duration: number | null;
  total_distance_meters: number | null;
  average_distance_meters: number | null;
}

interface RideSummaryRow {
  total_rides: number;
  total_duration: number | null;
  average_duration: number | null;
  longest_ride_duration: number | null;
  shortest_ride_duration: number | null;
  total_distance_meters: number | null;
  average_distance_meters: number | null;
}

@Injectable()
export class RideSummaryCalculatorService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async calculate(): Promise<RideSummary> {
    const [row] = await this.dataSource.query<RideSummaryRow[]>(`
      SELECT
        COUNT(*) as total_rides,
        SUM(duration) as total_duration,
        AVG(duration) as average_duration,
        MAX(duration) as longest_ride_duration,
        MIN(duration) as shortest_ride_duration,
        SUM(distance_meters) as total_distance_meters,
        AVG(distance_meters) as average_distance_meters
      FROM (
        SELECT
          rides.duration,
          ${RideRouteSubquery.distanceMeters()} as distance_meters
        FROM rides
      ) rides
    `);

    return {
      total_rides: Number(row.total_rides),
      total_duration: nullableInt(row.total_duration),
      average_duration: roundMoney(row.average_duration),
      longest_ride_duration: nullableInt(row.longest_ride_duration),
      shortest_ride_duration: nullableInt(row.shortest_ride_duration),
      total_distance_meters: nullableFloat(row.total_distance_meters),
      average_distance_meters: roundMoney(row.average_distance_meters),
    };
  }
}

function nullableInt(value: number | null): number | null {
  return value === null ? null : Math.trunc(Number(value));
}

function nullableFloat(value: number | null): number | null {
  return value === null ? null : Number(value);
}
