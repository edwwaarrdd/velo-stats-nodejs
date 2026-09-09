import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfiguration, configuration } from 'src/config/configuration';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from 'src/queue/queue-names';
import { HttpClientService } from 'src/common/http/http-client.service';
import { OPEN_METEO_ARCHIVE_URL } from 'src/weather/weather.tokens';
import { OSRM_BASE_URL } from 'src/routing/routing.tokens';
import { RIDES_JSON_PATH } from 'src/rides/rides.tokens';
import { VELO_ANTWERP_STATION_INFORMATION_URL } from 'src/stations/stations.tokens';
import { databaseOptions } from 'src/config/data-source';

/**
 * Everything the HTTP app, the CLI and the workers all need: configuration, the
 * database connection, the Redis queue connection and the HTTP client.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => ({
        ...databaseOptions(config.get('database', { infer: true }).path),
        autoLoadEntities: true,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) => ({
        connection: config.get('redis', { infer: true }),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    }),
    ...QUEUE_NAMES.map((name) => BullModule.registerQueue({ name })),
  ],
  providers: [
    HttpClientService,
    {
      provide: VELO_ANTWERP_STATION_INFORMATION_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) =>
        config.get('services', { infer: true }).veloAntwerpStationInformationUrl,
    },
    {
      provide: OSRM_BASE_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) =>
        config.get('services', { infer: true }).osrmBaseUrl,
    },
    {
      provide: OPEN_METEO_ARCHIVE_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) =>
        config.get('services', { infer: true }).openMeteoArchiveUrl,
    },
    {
      provide: RIDES_JSON_PATH,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfiguration, true>) =>
        config.get('services', { infer: true }).ridesJsonPath,
    },
  ],
  exports: [
    BullModule,
    HttpClientService,
    OPEN_METEO_ARCHIVE_URL,
    OSRM_BASE_URL,
    RIDES_JSON_PATH,
    VELO_ANTWERP_STATION_INFORMATION_URL,
  ],
})
export class CoreModule {}
