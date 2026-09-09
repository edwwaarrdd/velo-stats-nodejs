import { TravelMode } from 'src/routing/enums/travel-mode.enum';

/**
 * The correlated subqueries that resolve a ride's cycling distance and expected
 * ride time from the cached route between its origin and destination stations.
 *
 * Both are written as SQL fragments rather than query-builder calls because
 * they correlate against the outer `rides` row, which the builder cannot
 * express without a raw reference anyway.
 */
export class RideRouteSubquery {
  static distanceMeters(ridesAlias = 'rides'): string {
    return RideRouteSubquery.cachedBikeRoute('distance_meters', ridesAlias);
  }

  /**
   * The ride time the router predicts for the route, in seconds.
   */
  static expectedDurationSeconds(ridesAlias = 'rides'): string {
    return RideRouteSubquery.cachedBikeRoute('duration_seconds', ridesAlias);
  }

  private static cachedBikeRoute(column: string, ridesAlias: string): string {
    return `(
      SELECT station_routes.${column}
      FROM station_routes
      WHERE station_routes.origin_station_id = ${ridesAlias}.origin_station_code
        AND station_routes.destination_station_id = ${ridesAlias}.destination_station_code
        AND station_routes.mode = '${TravelMode.Bike}'
      LIMIT 1
    )`;
  }
}
