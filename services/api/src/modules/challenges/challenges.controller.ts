import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChallengeDto, JoinChallengeDto } from './dto/challenge.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Get()
  findAll() {
    return this.challengesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.challengesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @Body() dto: JoinChallengeDto, @Request() req) {
    return this.challengesService.join(id, req.user.id);
  }
}
