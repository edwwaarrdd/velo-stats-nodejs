import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { config as loadDotenv } from 'dotenv';

import { AppConfiguration } from 'src/config/configuration';
import { AppModule } from 'src/app.module';

loadDotenv();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfiguration, true>);

  app.enableCors({
    origin: config.get('corsAllowedOrigins', { infer: true }),
    methods: '*',
    allowedHeaders: '*',
  });

  await app.listen(config.get('port', { infer: true }), '0.0.0.0');
}

void bootstrap();
