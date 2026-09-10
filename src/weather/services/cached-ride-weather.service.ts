import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Coordinate } from 'src/common/coordinate';
import { OpenMeteoWeatherService } from 'src/weather/services/open-meteo-weather.service';
import { Ride } from 'src/rides/entities/ride.entity';
import { WeatherObservation } from 'src/weather/value-objects/weather-observation';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';

@Injectable()
export class CachedRideWeatherService {
  constructor(
    private readonly weatherService: OpenMeteoWeatherService,
    @InjectRepository(WeatherRecord) private readonly weatherRecords: Repository<WeatherRecord>,
  ) {}

  async getWeather(ride: Ride, location: Coordinate, force = false): Promise<WeatherObservation> {
    const cached = await this.weatherRecords.findOne({ where: { rideId: ride.rideId } });

    if (cached !== null && !force) {
      return new WeatherObservation(
        cached.temperatureC,
        cached.apparentTemperatureC,
        cached.precipitationMm,
        cached.rainMm,
        cached.snowfallCm,
        cached.cloudCoverPercent,
        cached.windSpeedKmh,
        cached.windGustsKmh,
        cached.windDirectionDegrees,
        cached.relativeHumidityPercent,
        cached.weatherCode,
        cached.observedAt,
      );
    }

    const observation = await this.weatherService.getWeather(location, ride.checkinTime);

    await this.weatherRecords.save({
      ...(cached ?? {}),
      rideId: ride.rideId,
      ...observation.toAttributes(),
    });

    return observation;
  }
}
