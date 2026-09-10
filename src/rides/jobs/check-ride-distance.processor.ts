import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Repository } from 'typeorm';

import { CachedStationRouteService } from 'src/routing/services/cached-station-route.service';
import { CheckRideDistanceJob, RIDE_DISTANCE_CHECKS_QUEUE } from 'src/queue/queue-names';
import { Ride } from 'src/rides/entities/ride.entity';
import { Station } from 'src/stations/entities/station.entity';
import { TravelMode } from 'src/routing/enums/travel-mode.enum';

/**
 * Concurrency is pinned to one so the free routing API is never called
 * concurrently.
 */
@Processor(RIDE_DISTANCE_CHECKS_QUEUE, { concurrency: 1 })
export class CheckRideDistanceProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckRideDistanceProcessor.name);

  constructor(
    private readonly routeService: CachedStationRouteService,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectRepository(Station) private readonly stations: Repository<Station>,
  ) {
    super();
  }

  async process(job: Job<CheckRideDistanceJob>): Promise<void> {
    const { rideId } = job.data;
    const ride = await this.rides.findOne({ where: { rideId } });

    if (ride === null) {
      throw new Error(`No ride found with id ${rideId}.`);
    }

    if (ride.distanceCheckedAt !== null) {
      return;
    }

    const origin = await this.stations.findOne({ where: { stationId: ride.originStationCode } });
    const destination = await this.stations.findOne({ where: { stationId: ride.destinationStationCode } });

    if (origin === null || destination === null) {
      this.logger.error(
        `Cannot check distance for ride ${rideId}: unknown station code(s) ${ride.originStationCode} / ${ride.destinationStationCode}`,
      );

      return;
    }

    await this.routeService.getRoute(origin, destination, TravelMode.Bike);

    await this.rides.update({ rideId }, { distanceCheckedAt: new Date() });
  }
}
