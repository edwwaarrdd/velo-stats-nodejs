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

  /**
   * List every ride, most recent first, with its cached distance, expected ride
   * time and weather.
   */
  @Get()
  async index(): Promise<{ results: SerializedRide[] }> {
    const rides = await this.rideList.list();

    return { results: rides.map(serializeRide) };
  }

  /**
   * Aggregate duration and distance statistics across every ride.
   */
  @Get('summary')
  summary(): Promise<RideSummary> {
    return this.summaryCalculator.calculate();
  }

  /**
   * The subscription cost per ride, and how it compares to buying passes.
   */
  @Get('cost')
  cost(): Promise<RideCost> {
    return this.costCalculator.calculate();
  }
}
