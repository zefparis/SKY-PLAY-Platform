import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { SubmitResultDto } from './dto/match.dto';

@UseGuards(JwtDualGuard)
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post(':id/result')
  submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto, @Request() req) {
    return this.matchesService.submitResult(id, req.user.id, dto);
  }
}
