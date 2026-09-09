import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Station } from 'src/stations/entities/station.entity';

@Injectable()
export class StationListService {
  constructor(@InjectRepository(Station) private readonly stations: Repository<Station>) {}

  list(): Promise<Station[]> {
    return this.stations.find();
  }
}
