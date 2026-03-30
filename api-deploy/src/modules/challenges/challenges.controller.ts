import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import {
  CreateChallengeDto,
  SubmitResultDto,
  ForceDisputeDto,
  ResolveDisputeDto,
} from './dto/challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('game') game?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.challengesService.findAll({
      status,
      game,
      type,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @UseGuards(JwtDualGuard)
  @Get('my')
  getMyChallenges(@Request() req) {
    return this.challengesService.getMyChallenges(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @UseGuards(JwtDualGuard)
  @Post()
  create(@Body() dto: CreateChallengeDto, @Request() req) {
    return this.challengesService.create(req.user.id, dto.title, dto.game, dto.type);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.challengesService.join(id, req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/submit-result')
  submitResult(
    @Param('id') id: string,
    @Body() dto: SubmitResultDto,
    @Request() req,
  ) {
    return this.challengesService.submitResult(id, req.user.id, dto.rank, dto.screenshotUrl);
  }

  @UseGuards(JwtDualGuard)
  @Post(':id/dispute')
  forceDispute(
    @Param('id') id: string,
    @Body() dto: ForceDisputeDto,
    @Request() req,
  ) {
    return this.challengesService.forceDispute(id, req.user.id, dto.reason);
  }

  @UseGuards(JwtDualGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.challengesService.deleteChallenge(id, req.user.id);
  }
}

@Controller('admin/challenges')
@UseGuards(JwtDualGuard)
export class AdminChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  private ensureAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }

  @Get('disputes')
  getDisputes(@Request() req, @Query('status') status?: string) {
    this.ensureAdmin(req);
    return this.challengesService.getDisputes(status);
  }

  @Get('disputes/:id')
  getDispute(@Param('id') id: string, @Request() req) {
    this.ensureAdmin(req);
    return this.challengesService.getDisputeById(id);
  }

  @Post('disputes/:id/resolve')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req,
  ) {
    this.ensureAdmin(req);
    return this.challengesService.resolveDispute(id, dto.winnerId, dto.adminNote, req.user.id);
  }
}
