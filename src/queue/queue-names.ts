/**
 * The queue names, kept identical to the Laravel application's so an existing
 * Redis instance is drained by the same workers.
 */
export const DEFAULT_QUEUE = 'default';

/**
 * A single worker consumes this queue so the free routing API is never called
 * concurrently.
 */
export const RIDE_DISTANCE_CHECKS_QUEUE = 'ride_distance_checks';

/**
 * A single worker consumes this queue so the free Open-Meteo API is never
 * called concurrently.
 */
export const RIDE_WEATHER_CHECKS_QUEUE = 'ride_weather_checks';

export const QUEUE_NAMES = [DEFAULT_QUEUE, RIDE_DISTANCE_CHECKS_QUEUE, RIDE_WEATHER_CHECKS_QUEUE] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export interface CheckRideDistanceJob {
  rideId: number;
}

export interface CheckRideWeatherJob {
  rideId: number;
  force: boolean;
}

export interface LogTestMessageJob {
  message: string;
}

/**
 * Jobs get a single attempt, matching the Laravel workers' `--tries=1`.
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: 1000,
};
