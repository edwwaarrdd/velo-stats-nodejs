import nock from 'nock';

import { TestContext, createTestContext } from 'test/helpers/test-app';
import { VeloAntwerpStationInformationService } from 'src/stations/services/velo-antwerp-station-information.service';
import { gbfsStation } from 'test/helpers/fixtures';

describe('VeloAntwerpStationInformationService', () => {
  let context: TestContext;
  let service: VeloAntwerpStationInformationService;

  beforeAll(async () => {
    context = await createTestContext();
    service = context.module.get(VeloAntwerpStationInformationService);
  });

  afterAll(() => context.close());

  function fakeFeed(stations: unknown[], status = 200): void {
    nock('https://gbfs.test').get('/station_information.json').reply(status, { data: { stations } });
  }

  it('maps the GBFS station feed onto station attributes', async () => {
    fakeFeed([gbfsStation('021', '021- Driekoningen')]);

    const stations = await service.fetchStations();

    expect(stations).toHaveLength(1);
    expect(stations[0]).toEqual({
      stationId: '021',
      name: '021- Driekoningen',
      shortName: '021',
      lat: 51.19548,
      lon: 4.41919,
      address: 'Driekoningenstraat 1',
      postCode: '2600',
      rentalMethods: ['KEY'],
      capacity: 28,
    });
  });

  it('defaults the rental methods and capacity when the feed omits them', async () => {
    const { rental_methods, capacity, ...withoutOptionals } = gbfsStation('021', '021- Driekoningen');

    fakeFeed([withoutOptionals]);

    const [station] = await service.fetchStations();

    expect(station.rentalMethods).toEqual([]);
    expect(station.capacity).toBe(0);
  });

  it('fails when the GBFS feed returns an error', async () => {
    nock('https://gbfs.test').get('/station_information.json').reply(503);

    await expect(service.fetchStations()).rejects.toThrow('failed with status 503');
  });
});
