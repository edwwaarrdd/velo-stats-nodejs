import { Command, CommandRunner } from 'nest-commander';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Queue } from 'bullmq';

import { CheckRideDistanceJob, RIDE_DISTANCE_CHECKS_QUEUE } from 'src/queue/queue-names';
import { Ride } from 'src/rides/entities/ride.entity';

@Command({
  name: 'rides:check-distances',
  description:
    'Queue a job per unchecked ride to calculate and cache the distance between its origin and destination stations.',
})
export class CheckRideDistancesCommand extends CommandRunner {
  constructor(
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectQueue(RIDE_DISTANCE_CHECKS_QUEUE) private readonly queue: Queue<CheckRideDistanceJob>,
  ) {
    super();
  }

  async run(_args: string[] = [], _options: Record<string, never> = {}): Promise<void> {
    const rides = await this.rides.find({
      where: { distanceCheckedAt: IsNull() },
      select: { rideId: true },
    });

    for (const ride of rides) {
      await this.queue.add('check-ride-distance', { rideId: ride.rideId });
    }

    console.log(`Dispatched ${rides.length} ride distance check task(s).`);
  }
}
