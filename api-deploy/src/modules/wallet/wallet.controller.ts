import {
  Controller, Get, Post, Body, Query,
  UseGuards, Request, Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import {
  InitiateDepositDto,
  VerifyDepositDto,
  InitiateWithdrawalDto,
  GetTransactionsQueryDto,
} from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtDualGuard)
  @Get()
  getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @UseGuards(JwtDualGuard)
  @Get('transactions')
  getTransactions(@Request() req, @Query() query: GetTransactionsQueryDto) {
    return this.walletService.getTransactions(req.user.id, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      type: query.type,
    });
  }

  @UseGuards(JwtDualGuard)
  @Post('deposit')
  initiateDeposit(@Request() req, @Body() dto: InitiateDepositDto) {
    return this.walletService.initiateDeposit(req.user.id, dto);
  }

  @UseGuards(JwtDualGuard)
  @Post('deposit/verify')
  verifyDeposit(@Request() req, @Body() dto: VerifyDepositDto) {
    return this.walletService.verifyDeposit(req.user.id, dto.flwTxId, dto.transactionId);
  }

  @UseGuards(JwtDualGuard)
  @Post('withdraw')
  initiateWithdrawal(@Request() req, @Body() dto: InitiateWithdrawalDto) {
    return this.walletService.initiateWithdrawal(req.user.id, dto);
  }

  @UseGuards(JwtDualGuard)
  @Post('limits')
  updateLimits(@Request() req, @Body() dto: { dailyDepositLimit?: number; weeklyDepositLimit?: number; dailySpendLimit?: number }) {
    return this.walletService.updateLimits(req.user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  flutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') verifHash: string,
    @Headers('x-flw-signature') xFlwSig: string,
  ) {
    const signature = verifHash || xFlwSig || '';
    return this.walletService.handleWebhook(payload, signature);
  }
}
