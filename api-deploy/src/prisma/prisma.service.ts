import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Permet de lancer l'API localement même si DATABASE_URL n'est pas défini.
    // Sur Railway, DATABASE_URL est fourni et la connexion est effectuée.
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      try {
        await this.$connect();
        console.log('[Prisma] Database connection established');
      } catch (error) {
        console.error('[Prisma] Database connection failed during startup:', error);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
