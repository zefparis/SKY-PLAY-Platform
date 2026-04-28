import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir les fichiers statiques (avatars)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Extra origins from env (comma-separated), e.g. for Railway staging or custom domains
  const extraOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const staticOrigins = [
    'https://sky-play-platform.vercel.app',
    'https://skyplay.cloud',
    'https://www.skyplay.cloud',
    'http://localhost:3000',
    'http://localhost:3001',
    'capacitor://localhost',
    'ionic://localhost',
    ...extraOrigins,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow all Vercel preview deployments for this project
      if (/^https:\/\/sky-play-platform(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      if (staticOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is listening on port ${port}`);
}

bootstrap().catch((error) => {
  logger.error('Application failed during bootstrap', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
