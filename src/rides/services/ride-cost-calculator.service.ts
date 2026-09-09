import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ride } from 'src/rides/entities/ride.entity';
import { apiDate } from 'src/common/api-date-time';
import { roundMoney } from 'src/common/round';

export interface RideCost {
  total_rides: number;
  first_ride_date: string | null;
  last_ride_date: string | null;
  date_range_days: number | null;
  subscription_price_eur: number;
  prorated_subscription_price_eur: number | null;
  cost_per_ride_eur: number | null;
  day_pass_equivalent_eur: number | null;
  week_pass_equivalent_eur: number | null;
  money_saved_vs_day_passes_eur: number | null;
  money_saved_vs_week_passes_eur: number | null;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Works out what the annual subscription costs per ride, and how that compares
 * to paying for the same rides with day or week passes.
 */
@Injectable()
export class RideCostCalculatorService {
  public static readonly ANNUAL_SUBSCRIPTION_PRICE_EUR = 58.0;

  public static readonly DAYS_PER_YEAR = 365;

  public static readonly DAY_PASS_PRICE_EUR = 5.0;

  public static readonly WEEK_PASS_PRICE_EUR = 12.0;

  constructor(@InjectRepository(Ride) private readonly rides: Repository<Ride>) {}

  async calculate(): Promise<RideCost> {
    const checkoutTimes = (await this.rides.find({ select: { checkoutTime: true } })).map(
      (ride) => ride.checkoutTime,
    );

    const totalRides = checkoutTimes.length;

    if (totalRides === 0) {
      return this.emptySummary();
    }

    const timestamps = checkoutTimes.map((checkoutTime) => checkoutTime.getTime());
    const firstRideDate = startOfUtcDay(new Date(Math.min(...timestamps)));
    const lastRideDate = startOfUtcDay(new Date(Math.max(...timestamps)));
    const dateRangeDays =
      Math.floor((lastRideDate.getTime() - firstRideDate.getTime()) / MILLISECONDS_PER_DAY) + 1;

    const proratedSubscriptionPrice = roundMoney(
      (RideCostCalculatorService.ANNUAL_SUBSCRIPTION_PRICE_EUR * dateRangeDays) /
        RideCostCalculatorService.DAYS_PER_YEAR,
    )!;
    const costPerRide = roundMoney(proratedSubscriptionPrice / totalRides);

    const rideDays = new Set(checkoutTimes.map((checkoutTime) => apiDate(checkoutTime))).size;
    const rideWeeks = new Set(checkoutTimes.map((checkoutTime) => isoWeekKey(checkoutTime))).size;

    const dayPassEquivalent = roundMoney(rideDays * RideCostCalculatorService.DAY_PASS_PRICE_EUR)!;
    const weekPassEquivalent = roundMoney(rideWeeks * RideCostCalculatorService.WEEK_PASS_PRICE_EUR)!;

    return {
      total_rides: totalRides,
      first_ride_date: apiDate(firstRideDate),
      last_ride_date: apiDate(lastRideDate),
      date_range_days: dateRangeDays,
      subscription_price_eur: RideCostCalculatorService.ANNUAL_SUBSCRIPTION_PRICE_EUR,
      prorated_subscription_price_eur: proratedSubscriptionPrice,
      cost_per_ride_eur: costPerRide,
      day_pass_equivalent_eur: dayPassEquivalent,
      week_pass_equivalent_eur: weekPassEquivalent,
      money_saved_vs_day_passes_eur: roundMoney(dayPassEquivalent - proratedSubscriptionPrice),
      money_saved_vs_week_passes_eur: roundMoney(weekPassEquivalent - proratedSubscriptionPrice),
    };
  }

  private emptySummary(): RideCost {
    return {
      total_rides: 0,
      first_ride_date: null,
      last_ride_date: null,
      date_range_days: null,
      subscription_price_eur: RideCostCalculatorService.ANNUAL_SUBSCRIPTION_PRICE_EUR,
      prorated_subscription_price_eur: null,
      cost_per_ride_eur: null,
      day_pass_equivalent_eur: null,
      week_pass_equivalent_eur: null,
      money_saved_vs_day_passes_eur: null,
      money_saved_vs_week_passes_eur: null,
    };
  }
}

function startOfUtcDay(value: Date): Date {
  return new Date(`${value.toISOString().slice(0, 10)}T00:00:00Z`);
}

/**
 * ISO week-year and week number in UTC, so a ride late in December belongs to
 * the first week of the next year when ISO says it does.
 *
 * The ISO week of a date is the week holding the Thursday of that date's
 * Monday-to-Sunday week, and week one is the week holding 4 January.
 */
function isoWeekKey(value: Date): string {
  const thursday = thursdayOfIsoWeek(value);
  const isoYear = thursday.getUTCFullYear();
  const firstThursday = thursdayOfIsoWeek(new Date(Date.UTC(isoYear, 0, 4)));
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * MILLISECONDS_PER_DAY));

  return `${isoYear}-${week}`;
}

function thursdayOfIsoWeek(value: Date): Date {
  const date = startOfUtcDay(value);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysSinceMonday + 3);

  return date;
}
