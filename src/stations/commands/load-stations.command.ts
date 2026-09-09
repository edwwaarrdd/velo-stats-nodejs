import { Command, CommandRunner } from 'nest-commander';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Station } from 'src/stations/entities/station.entity';
import { VeloAntwerpStationInformationService } from 'src/stations/services/velo-antwerp-station-information.service';

@Command({
  name: 'stations:load',
  description: 'Fetch Velo Antwerp station information and save it to the database.',
})
export class LoadStationsCommand extends CommandRunner {
  constructor(
    private readonly stations: VeloAntwerpStationInformationService,
    @InjectRepository(Station) private readonly repository: Repository<Station>,
  ) {
    super();
  }

  async run(_args: string[] = [], _options: Record<string, never> = {}): Promise<void> {
    const fetched = await this.stations.fetchStations();

    let createdCount = 0;
    let updatedCount = 0;

    for (const attributes of fetched) {
      const existing = await this.repository.findOne({ where: { stationId: attributes.stationId } });

      await this.repository.save(this.repository.create({ ...(existing ?? {}), ...attributes }));

      if (existing === null) {
        createdCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Loaded ${fetched.length} stations (${createdCount} created, ${updatedCount} updated).`);
  }
}
