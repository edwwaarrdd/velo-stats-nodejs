import { WeatherRecord } from 'src/weather/entities/weather-record.entity';
import { apiDateTime } from 'src/common/api-date-time';

export interface SerializedWeather {
  temperature_c: number;
  apparent_temperature_c: number;
  precipitation_mm: number;
  rain_mm: number;
  snowfall_cm: number;
  cloud_cover_percent: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  wind_direction_degrees: number;
  relative_humidity_percent: number;
  weather_code: number;
  observed_at: string | null;
}

export function serializeWeather(weather: WeatherRecord): SerializedWeather {
  return {
    temperature_c: weather.temperatureC,
    apparent_temperature_c: weather.apparentTemperatureC,
    precipitation_mm: weather.precipitationMm,
    rain_mm: weather.rainMm,
    snowfall_cm: weather.snowfallCm,
    cloud_cover_percent: weather.cloudCoverPercent,
    wind_speed_kmh: weather.windSpeedKmh,
    wind_gusts_kmh: weather.windGustsKmh,
    wind_direction_degrees: weather.windDirectionDegrees,
    relative_humidity_percent: weather.relativeHumidityPercent,
    weather_code: weather.weatherCode,
    observed_at: apiDateTime(weather.observedAt),
  };
}
