import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { ChampionshipService } from './championship.service';
import { TournamentsController } from './tournaments.controller';
import { WalletModule } from '../wallet/wallet.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [PrismaModule, WalletModule, LeaguesModule],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,
    ChampionshipService,
  ],
  exports: [TournamentsService, ChampionshipService],
})
export class TournamentsModule {}
