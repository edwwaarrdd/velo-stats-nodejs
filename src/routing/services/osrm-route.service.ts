import { Inject, Injectable } from '@nestjs/common';

import { Coordinate } from 'src/common/coordinate';
import { HttpClientService } from 'src/common/http/http-client.service';
import { OSRM_BASE_URL } from 'src/routing/routing.tokens';
import { Route, OsrmRoute } from 'src/routing/value-objects/route';
import { TravelMode, osrmInstancePath } from 'src/routing/enums/travel-mode.enum';

interface OsrmResponse {
  code?: string;
  message?: string;
  routes?: OsrmRoute[];
}

@Injectable()
export class OsrmRouteService {
  constructor(
    private readonly http: HttpClientService,
    @Inject(OSRM_BASE_URL) private readonly baseUrl: string,
  ) {}

  async getRoute(origin: Coordinate, destination: Coordinate, mode: TravelMode): Promise<Route> {
    // OSRM expects coordinates as "lon,lat", not "lat,lon".
    const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const url = `${this.baseUrl}/${osrmInstancePath(mode)}/route/v1/${mode}/${coordinates}`;

    const payload = await this.http.getJson<OsrmResponse>(url, { overview: 'false' });

    if (payload.code !== 'Ok') {
      throw new Error(`OSRM request failed: ${payload.message ?? payload.code ?? 'unknown error'}`);
    }

    return Route.fromOsrmRoute(payload.routes![0]);
  }
}
