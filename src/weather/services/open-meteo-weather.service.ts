import { Inject, Injectable } from '@nestjs/common';

import { Coordinate } from 'src/common/coordinate';
import { HttpClientService } from 'src/common/http/http-client.service';
import { OPEN_METEO_ARCHIVE_URL } from 'src/weather/weather.tokens';
import { OpenMeteoHourly, WeatherObservation } from 'src/weather/value-objects/weather-observation';

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
  reason?: string;
}

@Injectable()
export class OpenMeteoWeatherService {
  public static readonly HOURLY_VARIABLES = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation',
    'rain',
    'snowfall',
    'cloud_cover',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
    'relative_humidity_2m',
    'weather_code',
  ];

  constructor(
    private readonly http: HttpClientService,
    @Inject(OPEN_METEO_ARCHIVE_URL) private readonly archiveUrl: string,
  ) {}

  async getWeather(location: Coordinate, at: Date): Promise<WeatherObservation> {
    const date = at.toISOString().slice(0, 10);

    const payload = await this.http.getJson<OpenMeteoResponse>(this.archiveUrl, {
      latitude: location.lat,
      longitude: location.lon,
      start_date: date,
      end_date: date,
      hourly: OpenMeteoWeatherService.HOURLY_VARIABLES.join(','),
      timezone: 'UTC',
    });

    if (payload.hourly === undefined) {
      throw new Error(`Open-Meteo request failed: ${payload.reason ?? JSON.stringify(payload)}`);
    }

    const targetHour = `${at.toISOString().slice(0, 13)}:00`;
    const index = payload.hourly.time.indexOf(targetHour);

    if (index === -1) {
      throw new Error(`Open-Meteo response has no observation for ${targetHour}.`);
    }

    return WeatherObservation.fromOpenMeteoHourly(payload.hourly, index);
  }
}
