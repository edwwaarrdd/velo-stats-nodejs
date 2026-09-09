import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Queue } from 'bullmq';

import { CheckRideWeatherJob, RIDE_WEATHER_CHECKS_QUEUE } from 'src/queue/queue-names';
import { Ride } from 'src/rides/entities/ride.entity';

interface CheckRideWeatherOptions {
  force?: boolean;
}

@Command({
  name: 'rides:check-weather',
  description:
    'Queue a job per ride to fetch and cache the weather at its origin station and checkin time from Open-Meteo.',
})
export class CheckRideWeatherCommand extends CommandRunner {
  constructor(
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectQueue(RIDE_WEATHER_CHECKS_QUEUE) private readonly queue: Queue<CheckRideWeatherJob>,
  ) {
    super();
  }

  @Option({
    flags: '--force',
    description: 'Re-fetch weather for every ride, even if already checked',
  })
  parseForce(): boolean {
    return true;
  }

  async run(_args: string[], options: CheckRideWeatherOptions = {}): Promise<void> {
    const force = options.force === true;

    const rides = await this.rides.find({
      where: force ? {} : { weatherCheckedAt: IsNull() },
      select: { rideId: true },
    });

    for (const ride of rides) {
      await this.queue.add('check-ride-weather', { rideId: ride.rideId, force });
    }

    console.log(`Dispatched ${rides.length} ride weather check task(s).`);
  }
}
