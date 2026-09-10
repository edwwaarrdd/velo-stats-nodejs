import { Inject, Injectable } from '@nestjs/common';

import { HttpClientService } from 'src/common/http/http-client.service';
import { VELO_ANTWERP_STATION_INFORMATION_URL } from 'src/stations/stations.tokens';

export interface StationAttributes {
  stationId: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  address: string;
  postCode: string;
  rentalMethods: string[];
  capacity: number;
}

interface GbfsStation {
  station_id: string | number;
  name: string;
  short_name: string;
  lat: number | string;
  lon: number | string;
  address: string;
  post_code: string | number;
  rental_methods?: string[];
  capacity?: number | string;
}

interface GbfsResponse {
  data: { stations: GbfsStation[] };
}

@Injectable()
export class VeloAntwerpStationInformationService {
  constructor(
    private readonly http: HttpClientService,
    @Inject(VELO_ANTWERP_STATION_INFORMATION_URL) private readonly url: string,
  ) {}

  async fetchStations(): Promise<StationAttributes[]> {
    const payload = await this.http.getJson<GbfsResponse>(this.url);

    return payload.data.stations.map((station) => ({
      stationId: String(station.station_id),
      name: String(station.name),
      shortName: String(station.short_name),
      lat: Number(station.lat),
      lon: Number(station.lon),
      address: String(station.address),
      postCode: String(station.post_code),
      rentalMethods: Object.values(station.rental_methods ?? []),
      capacity: Number(station.capacity ?? 0),
    }));
  }
}
