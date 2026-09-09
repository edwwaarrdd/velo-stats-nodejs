import { Controller, Get } from '@nestjs/common';

import { SerializedStation, serializeStation } from 'src/stations/dto/station.serializer';
import { StationListService } from 'src/stations/services/station-list.service';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationList: StationListService) {}

  /**
   * List every known station with its coordinates.
   */
  @Get()
  async index(): Promise<{ results: SerializedStation[] }> {
    const stations = await this.stationList.list();

    return { results: stations.map(serializeStation) };
  }
}
