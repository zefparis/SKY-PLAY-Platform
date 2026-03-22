import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Permet de lancer l'API localement même si DATABASE_URL n'est pas défini.
    // Sur Railway, DATABASE_URL est fourni et la connexion est effectuée.
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
