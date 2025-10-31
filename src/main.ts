import 'module-alias/register';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './shared/logger/logger.service';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AdminSeeder } from './database/seeds/admin.seed';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  app.useLogger(logger);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix') || 'api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('swagger.title') || 'NestJS Backend Starter API')
    .setDescription(configService.get<string>('swagger.description') || 'A comprehensive NestJS backend starter template API')
    .setVersion(configService.get<string>('swagger.version') || '1.0')
    .addBearerAuth({
      type: 'http',
      name: 'Authorization',
      description: 'Enter your Bearer token',
      scheme: 'bearer',
      bearerFormat: 'Bearer',
      in: 'header',
    },
      'access-token'
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
  });
  SwaggerModule.setup('docs', app, document,{
    
     swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      operationsSorter: (a: any, b: any) => {
        const methodsOrder = [
          'post',
          'get',
          'put',
          'patch',
          'delete',
          'options',
          'trace',
        ];
        let result =
          methodsOrder.indexOf(a.get('method')) -
          methodsOrder.indexOf(b.get('method'));
        if (result === 0) {
          result = a.get('path').localeCompare(b.get('path'));
        }
        return result;
      },
      tagsSorter: 'alpha',
    }
  });

  // Run admin seeder
  try {
    const adminSeeder = app.get(AdminSeeder);
    await adminSeeder.seed();
    logger.log('Admin seeding completed');
  } catch (error) {
    logger.error('Error during admin seeding:', error);
  }

  const port = configService.get<number>('app.port') || 5000;
  const host = '0.0.0.0';
  await app.listen(port, host, () => {
    logger.log(`Server started on http://${host}:${port}`, 'Bootstrap');
  });
}

bootstrap();