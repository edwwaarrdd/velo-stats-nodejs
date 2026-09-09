import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';

import { AppModule } from 'src/app.module';
import { FakeQueue } from 'test/helpers/fake-queue';
import { QUEUE_NAMES, QueueName } from 'src/queue/queue-names';

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  queue(name: QueueName): FakeQueue;
  reset(): Promise<void>;
  close(): Promise<void>;
}

const TABLES = ['weather_records', 'station_routes', 'rides', 'stations'];

/**
 * Boots the real application against an in-memory database, with the queues
 * replaced by recording fakes.
 */
export async function createTestContext(): Promise<TestContext> {
  const queues = new Map<QueueName, FakeQueue>(QUEUE_NAMES.map((name) => [name, new FakeQueue(name)]));

  let builder = Test.createTestingModule({ imports: [AppModule] });

  for (const [name, queue] of queues) {
    builder = builder.overrideProvider(getQueueToken(name)).useValue(queue);
  }

  const module = await builder.compile();
  const app = module.createNestApplication();

  await app.init();

  const dataSource = module.get(DataSource);

  await dataSource.runMigrations();

  return {
    app,
    module,
    dataSource,
    queue: (name) => queues.get(name)!,
    async reset() {
      for (const table of TABLES) {
        await dataSource.query(`DELETE FROM ${table}`);
      }

      for (const queue of queues.values()) {
        queue.clear();
      }
    },
    close: () => app.close(),
  };
}
