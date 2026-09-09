import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Coordinate } from 'src/common/coordinate';
import { OsrmRouteService } from 'src/routing/services/osrm-route.service';
import { Route } from 'src/routing/value-objects/route';
import { Station } from 'src/stations/entities/station.entity';
import { StationRoute } from 'src/routing/entities/station-route.entity';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';

/**
 * Calculates routes between stations, caching results so a route between the
 * same pair of stations and travel mode is only ever calculated once.
 */
@Injectable()
export class CachedStationRouteService {
  constructor(
    private readonly routeService: OsrmRouteService,
    @InjectRepository(StationRoute) private readonly stationRoutes: Repository<StationRoute>,
  ) {}

  async getRoute(origin: Station, destination: Station, mode: TravelMode): Promise<Route> {
    const cached = await this.stationRoutes.findOne({
      where: {
        originStationId: origin.stationId,
        destinationStationId: destination.stationId,
        mode,
      },
    });

    if (cached !== null) {
      return new Route(cached.distanceMeters, cached.durationSeconds);
    }

    const route = await this.routeService.getRoute(
      new Coordinate(origin.lat, origin.lon),
      new Coordinate(destination.lat, destination.lon),
      mode,
    );

    await this.stationRoutes.save(
      this.stationRoutes.create({
        originStationId: origin.stationId,
        destinationStationId: destination.stationId,
        mode,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      }),
    );

    return route;
  }
}
