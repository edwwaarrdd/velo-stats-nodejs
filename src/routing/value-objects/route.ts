export interface OsrmRoute {
  distance: number;
  duration: number;
}

export class Route {
  constructor(
    public readonly distanceMeters: number,
    public readonly durationSeconds: number,
  ) {}

  static fromOsrmRoute(route: OsrmRoute): Route {
    return new Route(Number(route.distance), Number(route.duration));
  }
}
