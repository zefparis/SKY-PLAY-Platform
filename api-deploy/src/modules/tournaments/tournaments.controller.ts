import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { ChampionshipService } from './championship.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { CreateTournamentDto, JoinTournamentDto, SubmitMatchResultDto } from './dto/tournament.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly championshipService: ChampionshipService,
  ) {}

  @UseGuards(JwtDualGuard)
  @Post()
  createTournament(@Body() dto: CreateTournamentDto, @Request() req) {
    return this.tournamentsService.createTournament(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('game') game?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tournamentsService.findAll({
      game,
      type,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id/calendar')
  getCalendar(@Param('id') id: string) {
    return this.tournamentsService.getFullCalendar(id);
  }

  @Get(':id/championship-standings')
  getChampionshipStandings(@Param('id') id: string) {
    return this.championshipService.computeChampionshipStandings(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Get(':id/bracket')
  getBracket(@Param('id') id: string) {
    return this.tournamentsService.getBracket(id);
  }

  @Get(':id/standings')
  getStandings(@Param('id') id: string) {
    return this.tournamentsService.getStandings(id);
  }

  @Get(':id/winners')
  getWinners(@Param('id') id: string) {
    return this.tournamentsService.getWinners(id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/join')
  joinTournament(@Param('id') id: string, @Body() dto: JoinTournamentDto, @Request() req) {
    return this.tournamentsService.joinTournament(id, req.user.id, dto);
  }

  @UseGuards(JwtDualGuard)
  @Post('matches/:matchId/result')
  submitMatchResult(
    @Param('matchId') matchId: string,
    @Body() dto: SubmitMatchResultDto,
    @Request() req,
  ) {
    return this.tournamentsService.submitMatchResult(matchId, req.user.id, dto);
  }

  @UseGuards(JwtDualGuard)
  @Patch('matches/:matchId/stream')
  setStream(
    @Param('matchId') matchId: string,
    @Body('streamUrl') streamUrl: string,
    @Request() req,
  ) {
    return this.tournamentsService.setStream(matchId, req.user.id, streamUrl);
  }
}
