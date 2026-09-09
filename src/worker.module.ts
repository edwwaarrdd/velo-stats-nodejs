import { DynamicModule, Module } from '@nestjs/common';

import { CheckRideDistanceProcessor } from 'src/rides/jobs/check-ride-distance.processor';
import { CheckRideWeatherProcessor } from 'src/weather/jobs/check-ride-weather.processor';
import { CoreModule } from 'src/core.module';
import {
  DEFAULT_QUEUE,
  QueueName,
  RIDE_DISTANCE_CHECKS_QUEUE,
  RIDE_WEATHER_CHECKS_QUEUE,
} from 'src/queue/queue-names';
import { LogTestMessageProcessor } from 'src/tasks/jobs/log-test-message.processor';
import { RidesModule } from 'src/rides/rides.module';
import { RoutingModule } from 'src/routing/routing.module';
import { StationsModule } from 'src/stations/stations.module';
import { WeatherModule } from 'src/weather/weather.module';

const PROCESSORS = {
  [DEFAULT_QUEUE]: LogTestMessageProcessor,
  [RIDE_DISTANCE_CHECKS_QUEUE]: CheckRideDistanceProcessor,
  [RIDE_WEATHER_CHECKS_QUEUE]: CheckRideWeatherProcessor,
};

/**
 * A worker process runs the processor for exactly one queue, so each queue can
 * be scaled, restarted and rate-limited on its own.
 */
@Module({})
export class WorkerModule {
  static forQueue(queue: QueueName): DynamicModule {
    return {
      module: WorkerModule,
      imports: [CoreModule, RidesModule, RoutingModule, StationsModule, WeatherModule],
      providers: [PROCESSORS[queue]],
    };
  }
}
