export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  rain: number[];
  snowfall: number[];
  cloud_cover: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
  relative_humidity_2m: number[];
  weather_code: number[];
}

export interface WeatherAttributes {
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  rainMm: number;
  snowfallCm: number;
  cloudCoverPercent: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDegrees: number;
  relativeHumidityPercent: number;
  weatherCode: number;
  observedAt: Date;
}

export class WeatherObservation {
  constructor(
    public readonly temperatureC: number,
    public readonly apparentTemperatureC: number,
    public readonly precipitationMm: number,
    public readonly rainMm: number,
    public readonly snowfallCm: number,
    public readonly cloudCoverPercent: number,
    public readonly windSpeedKmh: number,
    public readonly windGustsKmh: number,
    public readonly windDirectionDegrees: number,
    public readonly relativeHumidityPercent: number,
    public readonly weatherCode: number,
    public readonly observedAt: Date,
  ) {}

  static fromOpenMeteoHourly(hourly: OpenMeteoHourly, index: number): WeatherObservation {
    return new WeatherObservation(
      Number(hourly.temperature_2m[index]),
      Number(hourly.apparent_temperature[index]),
      Number(hourly.precipitation[index]),
      Number(hourly.rain[index]),
      Number(hourly.snowfall[index]),
      Number(hourly.cloud_cover[index]),
      Number(hourly.wind_speed_10m[index]),
      Number(hourly.wind_gusts_10m[index]),
      Number(hourly.wind_direction_10m[index]),
      Number(hourly.relative_humidity_2m[index]),
      Number(hourly.weather_code[index]),
      // Open-Meteo returns naive local times, and the request pins the timezone to UTC.
      new Date(`${hourly.time[index]}:00Z`),
    );
  }

  toAttributes(): WeatherAttributes {
    return {
      temperatureC: this.temperatureC,
      apparentTemperatureC: this.apparentTemperatureC,
      precipitationMm: this.precipitationMm,
      rainMm: this.rainMm,
      snowfallCm: this.snowfallCm,
      cloudCoverPercent: this.cloudCoverPercent,
      windSpeedKmh: this.windSpeedKmh,
      windGustsKmh: this.windGustsKmh,
      windDirectionDegrees: this.windDirectionDegrees,
      relativeHumidityPercent: this.relativeHumidityPercent,
      weatherCode: this.weatherCode,
      observedAt: this.observedAt,
    };
  }
}
