import request from 'supertest';

import { RideCost } from 'src/rides/services/ride-cost-calculator.service';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { createRide } from 'test/factories';

describe('GET /rides/cost', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  async function cost(): Promise<RideCost> {
    const response = await request(context.app.getHttpServer()).get('/rides/cost');

    expect(response.status).toBe(200);

    return response.body;
  }

  it('reports no cost breakdown when there are no rides', async () => {
    expect(await cost()).toEqual({
      total_rides: 0,
      first_ride_date: null,
      last_ride_date: null,
      date_range_days: null,
      subscription_price_eur: 58.0,
      prorated_subscription_price_eur: null,
      cost_per_ride_eur: null,
      day_pass_equivalent_eur: null,
      week_pass_equivalent_eur: null,
      money_saved_vs_day_passes_eur: null,
      money_saved_vs_week_passes_eur: null,
    });
  });

  it('prorates the subscription over the ride date range', async () => {
    await createRide(context.dataSource, { checkoutTime: '2026-01-01 08:00:00' });
    await createRide(context.dataSource, { checkoutTime: '2026-01-01 12:00:00' });
    await createRide(context.dataSource, { checkoutTime: '2026-01-10 08:00:00' });

    expect(await cost()).toEqual({
      total_rides: 3,
      first_ride_date: '2026-01-01',
      last_ride_date: '2026-01-10',
      date_range_days: 10,
      subscription_price_eur: 58.0,
      prorated_subscription_price_eur: 1.59,
      cost_per_ride_eur: 0.53,
      day_pass_equivalent_eur: 10.0,
      week_pass_equivalent_eur: 24.0,
      money_saved_vs_day_passes_eur: 8.41,
      money_saved_vs_week_passes_eur: 22.41,
    });
  });

  it('counts a single ride as a one day range', async () => {
    await createRide(context.dataSource, { checkoutTime: '2026-05-04 09:30:00' });

    const result = await cost();

    expect(result.date_range_days).toBe(1);
    expect(result.first_ride_date).toBe('2026-05-04');
    expect(result.last_ride_date).toBe('2026-05-04');
    expect(result.prorated_subscription_price_eur).toBe(0.16);
    expect(result.cost_per_ride_eur).toBe(0.16);
    expect(result.day_pass_equivalent_eur).toBe(5.0);
    expect(result.week_pass_equivalent_eur).toBe(12.0);
  });

  it('counts rides in the same ISO week only once', async () => {
    // Monday and Sunday of the same ISO week, so two ride days but one week.
    await createRide(context.dataSource, { checkoutTime: '2026-03-02 08:00:00' });
    await createRide(context.dataSource, { checkoutTime: '2026-03-08 08:00:00' });

    const result = await cost();

    expect(result.day_pass_equivalent_eur).toBe(10.0);
    expect(result.week_pass_equivalent_eur).toBe(12.0);
  });

  it('counts ride days from the checkout time in UTC', async () => {
    await createRide(context.dataSource, { checkoutTime: '2026-06-01 23:30:00' });
    await createRide(context.dataSource, { checkoutTime: '2026-06-02 00:30:00' });

    const result = await cost();

    expect(result.first_ride_date).toBe('2026-06-01');
    expect(result.last_ride_date).toBe('2026-06-02');
    expect(result.date_range_days).toBe(2);
  });
});
