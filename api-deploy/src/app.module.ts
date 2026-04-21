import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { cognitoConfig } from './common/config/cognito.config';
import { ExclusionGuard } from './common/guards/exclusion.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { MatchesModule } from './modules/matches/matches.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './modules/health.controller';
import { ChatModule } from './modules/chat/chat.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { UploadModule } from './modules/upload/upload.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { LeaguesModule } from './modules/leagues/leagues.module';
import { AdsModule } from './modules/ads/ads.module';
import { LinkedAccountsModule } from './modules/linked-accounts/linked-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'prisma/.env'],
      load: [cognitoConfig],
    }),
    // Rate limiting global (config par défaut). Les endpoints peuvent surcharger via @Throttle.
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChallengesModule,
    MatchesModule,
    WalletModule,
    PaymentsModule,
    ChatModule,
    FriendshipsModule,
    NotificationsModule,
    AdminModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    UploadModule,
    TournamentsModule,
    LeaguesModule,
    AdsModule,
    LinkedAccountsModule,
  ],
  providers: [
    // Active la limitation de débit globalement (les routes peuvent surcharger via @Throttle/@SkipThrottle)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ExclusionGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
