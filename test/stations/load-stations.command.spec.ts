import nock from 'nock';

import { LoadStationsCommand } from 'src/stations/commands/load-stations.command';
import { Station } from 'src/stations/entities/station.entity';
import { TestContext, createTestContext } from 'test/helpers/test-app';
import { captureOutput } from 'test/helpers/capture-output';
import { createStation } from 'test/factories';
import { gbfsStation } from 'test/helpers/fixtures';

describe('stations:load', () => {
  let context: TestContext;
  let command: LoadStationsCommand;

  beforeAll(async () => {
    context = await createTestContext();
    command = context.module.get(LoadStationsCommand);
  });

  beforeEach(() => context.reset());

  afterAll(() => context.close());

  function fakeStationFeed(): void {
    nock('https://gbfs.test')
      .get('/station_information.json')
      .reply(200, {
        data: { stations: [gbfsStation('021', '021- Driekoningen'), gbfsStation('041', '041- Van Eyck')] },
      });
  }

  function stations() {
    return context.dataSource.getRepository(Station);
  }

  it('creates the stations from the feed', async () => {
    fakeStationFeed();

    const output = await captureOutput(() => command.run([], {}));

    expect(output).toContain('Loaded 2 stations (2 created, 0 updated).');
    expect(await stations().count()).toBe(2);
    expect((await stations().findOneByOrFail({ stationId: '021' })).capacity).toBe(28);
  });

  it('updates the stations it already knows about', async () => {
    await createStation(context.dataSource, { stationId: '021', name: 'stale name' });
    fakeStationFeed();

    const output = await captureOutput(() => command.run([], {}));

    expect(output).toContain('Loaded 2 stations (1 created, 1 updated).');
    expect(await stations().count()).toBe(2);
    expect((await stations().findOneByOrFail({ stationId: '021' })).name).toBe('021- Driekoningen');
  });
});
