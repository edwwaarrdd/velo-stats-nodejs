// Every test runs against an in-memory SQLite database and never touches the
// network, so no upstream URL or development database can be reached.
process.env.TZ = 'UTC';
process.env.DB_DATABASE = ':memory:';
process.env.VELO_ANTWERP_STATION_INFORMATION_URL = 'https://gbfs.test/station_information.json';
process.env.OSRM_BASE_URL = 'https://osrm.test';
process.env.OPEN_METEO_ARCHIVE_URL = 'https://open-meteo.test/v1/archive';

import nock from 'nock';

beforeAll(() => {
  nock.disableNetConnect();
  // supertest binds the app to an ephemeral local port, which is not a network
  // call the tests are trying to keep out.
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect('127.0.0.1');
});

afterAll(() => {
  nock.enableNetConnect();
});
