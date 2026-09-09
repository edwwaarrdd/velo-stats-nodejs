import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JsonFileRideService } from 'src/rides/services/json-file-ride.service';
import { Ride } from 'src/rides/entities/ride.entity';

interface LoadRidesOptions {
  path?: string;
}

@Command({
  name: 'rides:load',
  description: 'Load customer ride history from a JSON export into the database.',
})
export class LoadRidesCommand extends CommandRunner {
  constructor(
    private readonly rides: JsonFileRideService,
    @InjectRepository(Ride) private readonly repository: Repository<Ride>,
  ) {
    super();
  }

  @Option({
    flags: '--path <path>',
    description: 'Path to the rides JSON export (defaults to data/rides.json)',
  })
  parsePath(value: string): string {
    return value;
  }

  async run(_args: string[], options: LoadRidesOptions = {}): Promise<void> {
    const source = options.path === undefined ? this.rides : new JsonFileRideService(options.path);
    const fetched = source.fetchRides();

    let createdCount = 0;
    let updatedCount = 0;

    for (const attributes of fetched) {
      const existing = await this.repository.findOne({ where: { rideId: attributes.rideId } });

      await this.repository.save(this.repository.create({ ...(existing ?? {}), ...attributes }));

      if (existing === null) {
        createdCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Loaded ${fetched.length} rides (${createdCount} created, ${updatedCount} updated).`);
  }
}
