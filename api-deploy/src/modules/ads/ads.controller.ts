import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { AdsService, AdType } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(JwtDualGuard)
  @Get('display')
  getAd(
    @Request() req,
    @Query('type') type: AdType,
    @Query('game') game?: string,
    @Query('country') country?: string,
  ) {
    return this.adsService.getAd(type, req.user?.id, game, country);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/click')
  trackClick(@Param('id') id: string, @Request() req) {
    return this.adsService.trackClick(id, req.user.id);
  }
}

@Controller('admin/ads')
export class AdminAdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(JwtDualGuard)
  @Post()
  createAd(@Body() dto: any, @Request() req) {
    return this.adsService.createAd(dto, req.user?.role ?? '');
  }

  @UseGuards(JwtDualGuard)
  @Get('stats')
  getStats(@Request() req) {
    return this.adsService.getStats(req.user?.role ?? '');
  }
}
