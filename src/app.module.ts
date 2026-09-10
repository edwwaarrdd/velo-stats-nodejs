import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core.module';
import { HealthcheckController } from 'src/health/healthcheck.controller';
import { RidesModule } from 'src/rides/rides.module';
import { RoutingModule } from 'src/routing/routing.module';
import { StationsModule } from 'src/stations/stations.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { WeatherModule } from 'src/weather/weather.module';

/** Registers the queues as a producer; the workers run in their own processes, from worker.ts. */
@Module({
  imports: [CoreModule, RidesModule, RoutingModule, StationsModule, TasksModule, WeatherModule],
  controllers: [HealthcheckController],
})
export class AppModule {}
