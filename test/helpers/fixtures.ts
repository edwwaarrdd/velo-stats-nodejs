export function gbfsStation(stationId: string, name: string): Record<string, unknown> {
  return {
    station_id: stationId,
    name,
    short_name: stationId,
    lat: 51.19548,
    lon: 4.41919,
    address: 'Driekoningenstraat 1',
    post_code: '2600',
    rental_methods: ['KEY'],
    capacity: 28,
  };
}

export function osrmRouteResponse(distance = 1502.3, duration = 361.7): Record<string, unknown> {
  return { code: 'Ok', routes: [{ distance, duration }] };
}

export function openMeteoHourlyResponse(temperature = 18.0): Record<string, unknown> {
  return {
    hourly: {
      time: ['2026-09-06T09:00'],
      temperature_2m: [temperature],
      apparent_temperature: [17.1],
      precipitation: [0.2],
      rain: [0.2],
      snowfall: [0.0],
      cloud_cover: [42.0],
      wind_speed_10m: [11.2],
      wind_gusts_10m: [24.5],
      wind_direction_10m: [210.0],
      relative_humidity_2m: [68.0],
      weather_code: [3],
    },
  };
}
