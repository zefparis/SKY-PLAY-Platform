import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitResultDto } from './dto/match.dto';

@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post(':id/result')
  submitResult(@Param('id') id: string, @Body() dto: SubmitResultDto, @Request() req) {
    return this.matchesService.submitResult(id, req.user.id, dto);
  }
}
