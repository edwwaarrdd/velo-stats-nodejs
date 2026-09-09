import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CheckRideDistancesCommand } from 'src/rides/commands/check-ride-distances.command';
import { JsonFileRideService } from 'src/rides/services/json-file-ride.service';
import { LoadRidesCommand } from 'src/rides/commands/load-rides.command';
import { RIDES_JSON_PATH } from 'src/rides/rides.tokens';
import { Ride } from 'src/rides/entities/ride.entity';
import { RideCostCalculatorService } from 'src/rides/services/ride-cost-calculator.service';
import { RideListService } from 'src/rides/services/ride-list.service';
import { RideSummaryCalculatorService } from 'src/rides/services/ride-summary-calculator.service';
import { RidesController } from 'src/rides/rides.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  controllers: [RidesController],
  providers: [
    RideListService,
    RideSummaryCalculatorService,
    RideCostCalculatorService,
    {
      provide: JsonFileRideService,
      inject: [RIDES_JSON_PATH],
      useFactory: (path: string) => new JsonFileRideService(path),
    },
    LoadRidesCommand,
    CheckRideDistancesCommand,
  ],
  exports: [TypeOrmModule, JsonFileRideService, RideListService],
})
export class RidesModule {}
