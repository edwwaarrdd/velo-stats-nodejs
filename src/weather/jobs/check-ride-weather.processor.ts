import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Repository } from 'typeorm';

import { CachedRideWeatherService } from 'src/weather/services/cached-ride-weather.service';
import { CheckRideWeatherJob, RIDE_WEATHER_CHECKS_QUEUE } from 'src/queue/queue-names';
import { Coordinate } from 'src/common/coordinate';
import { Ride } from 'src/rides/entities/ride.entity';
import { Station } from 'src/stations/entities/station.entity';

/**
 * Concurrency is pinned to one so the free Open-Meteo API is never called
 * concurrently.
 */
@Processor(RIDE_WEATHER_CHECKS_QUEUE, { concurrency: 1 })
export class CheckRideWeatherProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckRideWeatherProcessor.name);

  constructor(
    private readonly weatherService: CachedRideWeatherService,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectRepository(Station) private readonly stations: Repository<Station>,
  ) {
    super();
  }

  async process(job: Job<CheckRideWeatherJob>): Promise<void> {
    const { rideId, force } = job.data;
    const ride = await this.rides.findOne({ where: { rideId } });

    if (ride === null) {
      throw new Error(`No ride found with id ${rideId}.`);
    }

    if (ride.weatherCheckedAt !== null && !force) {
      return;
    }

    const origin = await this.stations.findOne({ where: { stationId: ride.originStationCode } });

    if (origin === null) {
      this.logger.error(
        `Cannot check weather for ride ${rideId}: unknown origin station code ${ride.originStationCode}`,
      );

      return;
    }

    await this.weatherService.getWeather(ride, new Coordinate(origin.lat, origin.lon), force);

    await this.rides.update({ rideId }, { weatherCheckedAt: new Date() });
  }
}
