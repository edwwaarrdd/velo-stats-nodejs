import request from 'supertest';

import { TestContext, createTestContext } from 'test/helpers/test-app';

describe('healthcheck', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  afterAll(() => context.close());

  it('reports that the application is up', async () => {
    const response = await request(context.app.getHttpServer()).get('/_healthcheck');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok' });
  });
});
