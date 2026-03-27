import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorageService } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Active la limitation de débit (ThrottlerModule)
  app.useGlobalGuards(
    new ThrottlerGuard(
      // options (récupérées depuis ThrottlerModule)
      app.get('THROTTLER:MODULE_OPTIONS'),
      app.get(ThrottlerStorageService),
      app.get(Reflector),
    ),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 4000);
}

bootstrap();
