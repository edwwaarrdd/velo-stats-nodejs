import { Module } from '@nestjs/common';

import { AppModule } from 'src/app.module';

/**
 * The console application. It shares every provider with the HTTP app, so the
 * commands reach the same services, repositories and queues.
 */
@Module({
  imports: [AppModule],
})
export class CliModule {}
