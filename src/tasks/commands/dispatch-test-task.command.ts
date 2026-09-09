import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { DEFAULT_QUEUE, LogTestMessageJob } from 'src/queue/queue-names';

interface DispatchTestTaskOptions {
  message?: string;
}

const DEFAULT_MESSAGE = 'Hello from tasks:dispatch-test';

@Command({
  name: 'tasks:dispatch-test',
  description: 'Dispatch a test job that logs a message from the worker.',
})
export class DispatchTestTaskCommand extends CommandRunner {
  constructor(@InjectQueue(DEFAULT_QUEUE) private readonly queue: Queue<LogTestMessageJob>) {
    super();
  }

  @Option({
    flags: '--message <message>',
    description: 'Message the worker should write to the log',
  })
  parseMessage(value: string): string {
    return value;
  }

  async run(_args: string[], options: DispatchTestTaskOptions = {}): Promise<void> {
    await this.queue.add('log-test-message', { message: options.message ?? DEFAULT_MESSAGE });

    console.log('Dispatched a test task to the queue.');
  }
}
