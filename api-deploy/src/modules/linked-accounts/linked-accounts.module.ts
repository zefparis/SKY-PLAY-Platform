import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkedAccountsService } from './linked-accounts.service';
import { LinkedAccountsController, LinkedAccountsOAuthController } from './linked-accounts.controller';
import { CryptoHelper } from './crypto.helper';
import { SteamService } from './steam.service';
import { EpicService } from './epic.service';

@Module({
  imports: [ConfigModule],
  controllers: [LinkedAccountsController, LinkedAccountsOAuthController],
  providers: [LinkedAccountsService, CryptoHelper, SteamService, EpicService],
  exports: [LinkedAccountsService],
})
export class LinkedAccountsModule {}
