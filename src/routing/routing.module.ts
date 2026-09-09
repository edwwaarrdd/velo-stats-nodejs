import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CachedStationRouteService } from 'src/routing/services/cached-station-route.service';
import { OsrmRouteService } from 'src/routing/services/osrm-route.service';
import { StationRoute } from 'src/routing/entities/station-route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StationRoute])],
  providers: [OsrmRouteService, CachedStationRouteService],
  exports: [TypeOrmModule, OsrmRouteService, CachedStationRouteService],
})
export class RoutingModule {}
