import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { LeaguesService, TIER_DEFINITIONS } from './leagues.service';

@Controller('leagues')
export class LeaguesController {
  constructor(
    private readonly leaguesService: LeaguesService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtDualGuard)
  @Get('me')
  getMyLeagues(@Request() req) {
    return this.leaguesService.getMyLeagues(req.user.id);
  }

  @Get('tiers')
  getTiers() {
    return TIER_DEFINITIONS;
  }

  @Get(':id/standings')
  getStandings(@Param('id') id: string) {
    return this.leaguesService.getLeagueStandings(id);
  }

  @Post('award-points')
  async awardPoints(
    @Headers('x-api-key') apiKey: string,
    @Body() body: { userId: string; game: string; points: number },
  ) {
    const adminKey = this.config.get<string>('INTERNAL_API_KEY');
    if (!adminKey || apiKey !== adminKey) {
      throw new ForbiddenException('Clé API invalide');
    }
    await this.leaguesService.awardLeaguePoints(body.userId, body.game, body.points);
    return { awarded: true };
  }
}
