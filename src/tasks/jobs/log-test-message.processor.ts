import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { DEFAULT_QUEUE, LogTestMessageJob } from 'src/queue/queue-names';

/**
 * Logs a message from the worker, so the queue setup can be verified.
 */
@Processor(DEFAULT_QUEUE)
export class LogTestMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(LogTestMessageProcessor.name);

  process(job: Job<LogTestMessageJob>): Promise<void> {
    this.logger.log(`Test task received: ${job.data.message}`);

    return Promise.resolve();
  }
}
