import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { DepositDto, WithdrawDto } from './dto/payment.dto';

@UseGuards(JwtDualGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('deposit')
  deposit(@Body() dto: DepositDto, @Request() req) {
    return this.paymentsService.deposit(req.user.id, dto);
  }

  @Post('withdraw')
  withdraw(@Body() dto: WithdrawDto, @Request() req) {
    return this.paymentsService.withdraw(req.user.id, dto);
  }
}
