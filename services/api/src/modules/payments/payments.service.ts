import { Injectable } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { DepositDto, WithdrawDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private walletService: WalletService) {}

  async deposit(userId: string, dto: DepositDto) {
    const mockFlutterwaveResponse = {
      status: 'success',
      transaction_id: `FLW_${Date.now()}`,
      amount: dto.amount,
    };

    await this.walletService.credit(
      userId,
      dto.amount,
      'DEPOSIT',
      `Deposit via ${dto.provider || 'Flutterwave'}`
    );

    return {
      success: true,
      message: 'Deposit successful',
      transaction: mockFlutterwaveResponse,
    };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    await this.walletService.debit(
      userId,
      dto.amount,
      'WITHDRAWAL',
      `Withdrawal to ${dto.accountNumber}`
    );

    return {
      success: true,
      message: 'Withdrawal initiated',
    };
  }
}
