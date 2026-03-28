import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Servir les fichiers statiques (avatars)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      const fallbackOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://sky-play-platform.vercel.app'];
      const origins = allowedOrigins.length > 0 ? allowedOrigins : fallbackOrigins;

      if (!origin || origins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 4000);
  logger.log(`Application is listening on port ${process.env.PORT || 4000}`);
}

bootstrap().catch((error) => {
  logger.error('Application failed during bootstrap', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
