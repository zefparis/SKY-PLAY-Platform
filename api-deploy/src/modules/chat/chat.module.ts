import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { IceServersService } from './ice-servers.service';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ChallengesModule),
    TournamentsModule,
    LeaguesModule,
    WalletModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  providers: [ChatGateway, ChatService, IceServersService],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway, IceServersService],
})
export class ChatModule {}
