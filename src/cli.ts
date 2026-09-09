import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { config as loadDotenv } from 'dotenv';

import { CliModule } from 'src/cli.module';

loadDotenv();

async function bootstrap(): Promise<void> {
  await CommandFactory.run(CliModule, ['warn', 'error']);

  // Commands finish as soon as their work is done; the Redis and SQLite
  // connections would otherwise hold the process open.
  process.exit(0);
}

void bootstrap();
