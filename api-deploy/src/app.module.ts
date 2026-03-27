import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { cognitoConfig } from './common/config/cognito.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { MatchesModule } from './modules/matches/matches.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';

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
  ],
})
export class AppModule {}
