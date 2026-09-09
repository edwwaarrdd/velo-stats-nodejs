import { Module } from '@nestjs/common';

import { CoreModule } from 'src/core.module';
import { HealthcheckController } from 'src/health/healthcheck.controller';
import { RidesModule } from 'src/rides/rides.module';
import { RoutingModule } from 'src/routing/routing.module';
import { StationsModule } from 'src/stations/stations.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { WeatherModule } from 'src/weather/weather.module';

/**
 * The HTTP application. It registers the queues as a producer but runs no
 * workers; those live in their own processes, started by worker.ts.
 */
@Module({
  imports: [CoreModule, RidesModule, RoutingModule, StationsModule, TasksModule, WeatherModule],
  controllers: [HealthcheckController],
})
export class AppModule {}
