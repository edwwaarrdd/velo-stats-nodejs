import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CachedRideWeatherService } from 'src/weather/services/cached-ride-weather.service';
import { CheckRideWeatherCommand } from 'src/weather/commands/check-ride-weather.command';
import { OpenMeteoWeatherService } from 'src/weather/services/open-meteo-weather.service';
import { Ride } from 'src/rides/entities/ride.entity';
import { WeatherRecord } from 'src/weather/entities/weather-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherRecord, Ride])],
  providers: [OpenMeteoWeatherService, CachedRideWeatherService, CheckRideWeatherCommand],
  exports: [TypeOrmModule, OpenMeteoWeatherService, CachedRideWeatherService],
})
export class WeatherModule {}
