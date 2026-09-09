import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { DEFAULT_QUEUE, LogTestMessageJob } from 'src/queue/queue-names';
import { LogTestMessageProcessor } from 'src/tasks/jobs/log-test-message.processor';
import { WorkerModule } from 'src/worker.module';

describe('LogTestMessageProcessor', () => {
  it('runs on the default queue', () => {
    const { providers } = WorkerModule.forQueue(DEFAULT_QUEUE);

    expect(providers).toEqual([LogTestMessageProcessor]);
  });

  it('logs the message it was given', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    await new LogTestMessageProcessor().process({
      data: { message: 'hello world' },
    } as Job<LogTestMessageJob>);

    expect(log).toHaveBeenCalledWith('Test task received: hello world');

    log.mockRestore();
  });
});
