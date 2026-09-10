import { Controller, Get } from '@nestjs/common';

import { RideCost, RideCostCalculatorService } from 'src/rides/services/ride-cost-calculator.service';
import { RideListService } from 'src/rides/services/ride-list.service';
import {
  RideSummary,
  RideSummaryCalculatorService,
} from 'src/rides/services/ride-summary-calculator.service';
import { SerializedRide, serializeRide } from 'src/rides/dto/ride.serializer';

@Controller('rides')
export class RidesController {
  constructor(
    private readonly rideList: RideListService,
    private readonly summaryCalculator: RideSummaryCalculatorService,
    private readonly costCalculator: RideCostCalculatorService,
  ) {}

  @Get()
  async index(): Promise<{ results: SerializedRide[] }> {
    const rides = await this.rideList.list();

    return { results: rides.map(serializeRide) };
  }

  @Get('summary')
  summary(): Promise<RideSummary> {
    return this.summaryCalculator.calculate();
  }

  @Get('cost')
  cost(): Promise<RideCost> {
    return this.costCalculator.calculate();
  }
}
