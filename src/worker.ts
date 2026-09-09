import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadDotenv } from 'dotenv';

import { QUEUE_NAMES, QueueName } from 'src/queue/queue-names';
import { WorkerModule } from 'src/worker.module';

loadDotenv();

function resolveQueue(): QueueName {
  const requested = process.argv[2] ?? process.env.QUEUE_NAME ?? '';

  if (!(QUEUE_NAMES as readonly string[]).includes(requested)) {
    throw new Error(
      `Unknown queue "${requested}". Pass one of ${QUEUE_NAMES.join(', ')} as an argument or in QUEUE_NAME.`,
    );
  }

  return requested as QueueName;
}

async function bootstrap(): Promise<void> {
  const queue = resolveQueue();
  const app = await NestFactory.createApplicationContext(WorkerModule.forQueue(queue));

  app.enableShutdownHooks();

  new Logger('Worker').log(`Processing jobs on the "${queue}" queue.`);
}

void bootstrap();
