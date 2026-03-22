import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepositDto, WithdrawDto } from './dto/payment.dto';

@UseGuards(JwtAuthGuard)
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
