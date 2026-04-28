import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { RolesGuard } from '../admin/guards/roles.guard';
import { DisputesService } from './disputes.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('disputes')
@UseGuards(JwtDualGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get('pending')
  getPending() {
    return this.disputes.getPending();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.disputes.getById(id);
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id;
    return this.disputes.resolveDispute(id, adminId, dto);
  }
}
