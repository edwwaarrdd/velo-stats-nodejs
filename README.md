# Velo Stats

NestJS app for tracking Velo Antwerp bike-share stations, ride history, routing and weather.

Ride history is loaded from a JSON export, station information from the public Velo Antwerp GBFS feed. Each ride is
then enriched in the background: the cycling distance between its two stations comes from the public OSRM routing
API, and the weather at its origin station and checkin time comes from the free Open-Meteo archive. The API serves
the combined data as JSON.

## Setup

```
docker compose up -d --build
```

This starts five services:
- `app` – NestJS app served on port `8000`
- `redis` – queue backend
- `worker` – queue worker for the `default` queue
- `worker-ride-distance` – worker consuming the `ride_distance_checks` queue one job at a time, so calls to the free
  routing API are never made concurrently
- `worker-ride-weather` – worker consuming the `ride_weather_checks` queue one job at a time, so calls to the free
  Open-Meteo API are never made concurrently

Every container creates `.env` from `.env.example` on first start and runs the migrations, so no manual setup is
needed.

Verify the app is up and running:

```
curl http://localhost:8000/_healthcheck
```

Should return a 200 OK response.

Stop everything with:

```
docker compose down
```

The project directory is bind-mounted into every container, so source edits are picked up on the next build.
Dependencies and the compiled output live in the image rather than the mount, so after changing `package.json` or
any TypeScript, rebuild and recreate:

```
docker compose up -d --build --force-recreate --renew-anon-volumes
```

### Loading data

A fresh database is empty. Populate it in this order:

```
docker compose exec app npm run cli -- stations:load
docker compose exec app npm run cli -- rides:load
docker compose exec app npm run cli -- rides:check-distances
docker compose exec app npm run cli -- rides:check-weather
```

The last two commands queue one job per ride and return immediately. The dedicated workers drain them one call at a
time, which takes a few minutes for a full ride history.

### Configuration

Environment variables (set in `docker-compose.yml`):

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `8000` | Host port the `app` container publishes to |
| `PORT` | `8000` | Port the HTTP API listens on inside the container |
| `TZ` | `UTC` | Timezone all times are stored and rendered in |
| `DB_DATABASE` | `database/database.sqlite` | Path to the SQLite database file |
| `REDIS_HOST` | `redis` | Redis host backing the queues |
| `REDIS_PORT` | `6379` | Redis port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated origins allowed to call the API |

Data is persisted to a SQLite database at `database/database.sqlite`.

The three upstream endpoints default to the public feeds and can be overridden with
`VELO_ANTWERP_STATION_INFORMATION_URL`, `OSRM_BASE_URL` and `OPEN_METEO_ARCHIVE_URL`. The ride export path is
`RIDES_JSON_PATH`, relative to the project root.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/_healthcheck` | Returns `{"message": "ok"}` with a 200 status if the app is up |
| `GET` | `/rides` | Returns every ride with its basic info, distance (from the cached station route), speed (distance ÷ the exact time between check-out and check-in), the expected ride time from the cached route and how far the actual ride time was under or over it, and cached weather, most recent first |
| `GET` | `/rides/summary` | Returns aggregate stats across all rides: total rides, total/average/longest/shortest duration, and total/average distance |
| `GET` | `/rides/cost` | Returns the cost per ride, using the € 58/year subscription price prorated over the date range from the first to the last ride, plus the equivalent cost and money saved versus paying with day passes (€ 5) or week passes (€ 12) instead |

## Console Commands

Run against the running `app` container:

```
docker compose exec app npm run cli -- <command>
```

| Command | Description |
|---|---|
| `stations:load` | Fetches Velo Antwerp station information from the public GBFS feed and upserts it into the database |
| `rides:load [--path PATH]` | Loads ride history from a JSON export (defaults to `data/rides.json`) and upserts it into the database |
| `tasks:dispatch-test [--message MSG]` | Dispatches a test job that logs a message from the worker, useful for verifying the queue setup |
| `rides:check-distances` | Queues a job per unchecked ride to calculate and cache the distance between its origin and destination stations, one at a time via the `ride_distance_checks` queue |
| `rides:check-weather [--force]` | Queues a job per ride to fetch and cache the biking-relevant weather (temperature, precipitation, wind, cloud cover, humidity, weather code) at its origin station and checkin time from the free Open-Meteo API, one at a time via the `ride_weather_checks` queue. Only unchecked rides are queued by default; pass `--force` to re-fetch weather for every ride |

### Verifying the queue setup

Dispatch a test "hello world" job through the `app` container:

```
docker compose exec app npm run cli -- tasks:dispatch-test --message "hello world"
```

Then check the `worker` container's logs to confirm the message was picked up and processed:

```
docker compose logs worker
```

You should see a log line containing `hello world` from the worker.

## Development

Without Docker, with a Redis server reachable on `127.0.0.1:6379`:

```
npm install
cp .env.example .env
npm run build
npm run migration:run
npm start
```

`npm run cli -- <command>` runs a console command and `npm run worker -- <queue>` starts a worker for one queue.
Both run the compiled output, so rebuild after changing any source.

## Tests

```
npm test
```

The suite runs against an in-memory SQLite database and fakes every third-party call, so it never touches the
network or the development database.

## Project structure

Each domain owns its entities, services, jobs and commands, mirroring how the data flows through the app.

```
src/
  common/       rounding, UTC formatting, the HTTP client
  config/       environment configuration and the TypeORM data source
  database/     migrations
  health/       the healthcheck endpoint
  queue/        queue names and job payload types
  rides/        ride entity, endpoints, cost and summary calculators, the JSON export reader
  routing/      station routes, the OSRM client and its cache
  stations/     station entity and the GBFS client
  tasks/        the test job used to verify the queue setup
  weather/      weather records, the Open-Meteo client and its cache
```

Three entrypoints share those modules: `main.ts` serves the API, `cli.ts` runs the console commands, and
`worker.ts` runs the worker for a single queue.
