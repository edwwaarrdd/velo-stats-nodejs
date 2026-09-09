import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoadStationsCommand } from 'src/stations/commands/load-stations.command';
import { Station } from 'src/stations/entities/station.entity';
import { StationListService } from 'src/stations/services/station-list.service';
import { StationsController } from 'src/stations/stations.controller';
import { VeloAntwerpStationInformationService } from 'src/stations/services/velo-antwerp-station-information.service';

@Module({
  imports: [TypeOrmModule.forFeature([Station])],
  controllers: [StationsController],
  providers: [VeloAntwerpStationInformationService, LoadStationsCommand, StationListService],
  exports: [TypeOrmModule, VeloAntwerpStationInformationService],
})
export class StationsModule {}
