import { Ride } from 'src/rides/entities/ride.entity';
import { SerializedWeather, serializeWeather } from 'src/weather/dto/weather.serializer';
import { apiDateTime } from 'src/common/api-date-time';
import { roundMoney } from 'src/common/round';

export interface RideWithRoute extends Ride {
  distanceMeters: number | null;
  expectedDurationSeconds: number | null;
}

export interface SerializedRide {
  ride_id: number;
  account_id: number;
  status: string;
  duration: number;
  bike_number: string;
  origin_station_code: string;
  origin_station: string;
  origin_slot_id: string;
  checkout_time: string | null;
  destination_station_code: string;
  destination_station: string;
  destination_slot_id: string;
  checkin_time: string | null;
  distance_meters: number | null;
  speed_kmh: number | null;
  expected_duration_seconds: number | null;
  actual_duration_seconds: number | null;
  duration_vs_expected_seconds: number | null;
  weather: SerializedWeather | null;
}

export function serializeRide(ride: RideWithRoute): SerializedRide {
  return {
    ride_id: ride.rideId,
    account_id: ride.accountId,
    status: ride.status,
    duration: ride.duration,
    bike_number: ride.bikeNumber,
    origin_station_code: ride.originStationCode,
    origin_station: ride.originStation,
    origin_slot_id: ride.originSlotId,
    checkout_time: apiDateTime(ride.checkoutTime),
    destination_station_code: ride.destinationStationCode,
    destination_station: ride.destinationStation,
    destination_slot_id: ride.destinationSlotId,
    checkin_time: apiDateTime(ride.checkinTime),
    distance_meters: ride.distanceMeters,
    speed_kmh: speedKmh(ride),
    expected_duration_seconds: roundMoney(ride.expectedDurationSeconds),
    actual_duration_seconds: actualDurationSeconds(ride),
    duration_vs_expected_seconds: durationVsExpectedSeconds(ride),
    weather: ride.weather ? serializeWeather(ride.weather) : null,
  };
}

/**
 * This divides by the exact ride time rather than the `duration` field, which
 * truncates to whole minutes and so overstates the speed.
 */
function speedKmh(ride: RideWithRoute): number | null {
  const seconds = actualDurationSeconds(ride);

  if (ride.distanceMeters === null || seconds === null || seconds <= 0) {
    return null;
  }

  return roundMoney(ride.distanceMeters / 1000 / (seconds / 3600));
}

/** `duration` is only stored in whole minutes, so this recomputes to the second. */
function actualDurationSeconds(ride: RideWithRoute): number | null {
  if (!ride.checkinTime || !ride.checkoutTime) {
    return null;
  }

  return roundMoney((ride.checkinTime.getTime() - ride.checkoutTime.getTime()) / 1000);
}

/** Negative means faster than the router predicted. */
function durationVsExpectedSeconds(ride: RideWithRoute): number | null {
  const actual = actualDurationSeconds(ride);

  if (actual === null || ride.expectedDurationSeconds === null) {
    return null;
  }

  return roundMoney(actual - ride.expectedDurationSeconds);
}
