import { CheckRideDistancesCommand } from 'src/rides/commands/check-ride-distances.command';
import { CheckRideWeatherCommand } from 'src/weather/commands/check-ride-weather.command';
import { DispatchTestTaskCommand } from 'src/tasks/commands/dispatch-test-task.command';
import { DEFAULT_QUEUE, RIDE_DISTANCE_CHECKS_QUEUE, RIDE_WEATHER_CHECKS_QUEUE } from 'src/queue/queue-names';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { captureOutput } from 'test/helpers/capture-output';
import { createRide, utc } from 'test/factories';

describe('the queueing commands', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  it('dispatches a distance check for every unchecked ride', async () => {
    await createRide(context.dataSource);
    await createRide(context.dataSource);
    await createRide(context.dataSource, { distanceCheckedAt: utc('2026-01-01 00:00:00') });

    const output = await captureOutput(() => context.module.get(CheckRideDistancesCommand).run([], {}));

    expect(output).toContain('Dispatched 2 ride distance check task(s).');
    expect(context.queue(RIDE_DISTANCE_CHECKS_QUEUE).jobs).toHaveLength(2);
    expect(context.queue(RIDE_WEATHER_CHECKS_QUEUE).jobs).toHaveLength(0);
  });

  it('dispatches a weather check for every unchecked ride', async () => {
    await createRide(context.dataSource);
    await createRide(context.dataSource);
    await createRide(context.dataSource, { weatherCheckedAt: utc('2026-01-01 00:00:00') });

    const output = await captureOutput(() => context.module.get(CheckRideWeatherCommand).run([], {}));

    expect(output).toContain('Dispatched 2 ride weather check task(s).');

    const jobs = context.queue(RIDE_WEATHER_CHECKS_QUEUE).jobs;

    expect(jobs).toHaveLength(2);
    expect(jobs.every((job) => (job.data as { force: boolean }).force === false)).toBe(true);
  });

  it('dispatches a weather check for every ride when forced', async () => {
    await createRide(context.dataSource);
    await createRide(context.dataSource);
    await createRide(context.dataSource, { weatherCheckedAt: utc('2026-01-01 00:00:00') });

    const output = await captureOutput(() =>
      context.module.get(CheckRideWeatherCommand).run([], { force: true }),
    );

    expect(output).toContain('Dispatched 3 ride weather check task(s).');

    const jobs = context.queue(RIDE_WEATHER_CHECKS_QUEUE).jobs;

    expect(jobs).toHaveLength(3);
    expect(jobs.every((job) => (job.data as { force: boolean }).force === true)).toBe(true);
  });

  it('dispatches a test task onto the default queue', async () => {
    const output = await captureOutput(() =>
      context.module.get(DispatchTestTaskCommand).run([], { message: 'hello world' }),
    );

    expect(output).toContain('Dispatched a test task to the queue.');
    expect(context.queue(DEFAULT_QUEUE).jobs).toEqual([
      { name: 'log-test-message', data: { message: 'hello world' } },
    ]);
  });

  it('falls back to the default message', async () => {
    await captureOutput(() => context.module.get(DispatchTestTaskCommand).run([], {}));

    expect(context.queue(DEFAULT_QUEUE).jobs[0].data).toEqual({
      message: 'Hello from tasks:dispatch-test',
    });
  });
});
