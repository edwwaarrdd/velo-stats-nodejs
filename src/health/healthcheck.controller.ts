import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthcheckController {
  @Get('_healthcheck')
  index(): { message: string } {
    return { message: 'ok' };
  }
}
