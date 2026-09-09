import { Station } from 'src/stations/entities/station.entity';

export interface SerializedStation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
}

export function serializeStation(station: Station): SerializedStation {
  return {
    station_id: station.stationId,
    name: station.name,
    lat: station.lat,
    lon: station.lon,
  };
}
