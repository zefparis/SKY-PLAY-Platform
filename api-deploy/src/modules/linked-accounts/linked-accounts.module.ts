import { Module } from '@nestjs/common';
import { LinkedAccountsService } from './linked-accounts.service';
import { LinkedAccountsController } from './linked-accounts.controller';
import { CryptoHelper } from './crypto.helper';

@Module({
  controllers: [LinkedAccountsController],
  providers: [LinkedAccountsService, CryptoHelper],
  exports: [LinkedAccountsService],
})
export class LinkedAccountsModule {}
