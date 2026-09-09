import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoadStationsCommand } from 'src/stations/commands/load-stations.command';
import { Station } from 'src/stations/entities/station.entity';
import { VeloAntwerpStationInformationService } from 'src/stations/services/velo-antwerp-station-information.service';

@Module({
  imports: [TypeOrmModule.forFeature([Station])],
  providers: [VeloAntwerpStationInformationService, LoadStationsCommand],
  exports: [TypeOrmModule, VeloAntwerpStationInformationService],
})
export class StationsModule {}
