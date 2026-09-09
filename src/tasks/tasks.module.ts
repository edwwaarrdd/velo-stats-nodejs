import { Module } from '@nestjs/common';

import { DispatchTestTaskCommand } from 'src/tasks/commands/dispatch-test-task.command';

@Module({
  providers: [DispatchTestTaskCommand],
})
export class TasksModule {}
