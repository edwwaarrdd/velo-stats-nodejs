import request from 'supertest';

import { SerializedStation } from 'src/stations/dto/station.serializer';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { createStation } from 'test/factories';

describe('GET /stations', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  async function results(): Promise<SerializedStation[]> {
    const response = await request(context.app.getHttpServer()).get('/stations');

    expect(response.status).toBe(200);

    return response.body.results;
  }

  it('returns an empty result list when there are no stations', async () => {
    const response = await request(context.app.getHttpServer()).get('/stations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ results: [] });
  });

  it('returns every station with its id, name and coordinates', async () => {
    await createStation(context.dataSource, {
      stationId: '041',
      name: '041- Van Eyck',
      lat: 51.2189,
      lon: 4.4131,
    });

    expect(await results()).toEqual([
      {
        station_id: '041',
        name: '041- Van Eyck',
        lat: 51.2189,
        lon: 4.4131,
      },
    ]);
  });
});
