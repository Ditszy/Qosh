import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ensureProfileImageUploadDirectory, UPLOADS_ROOT_DIR } from './users/profile-image-upload';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  await ensureProfileImageUploadDirectory();
  app.useStaticAssets(UPLOADS_ROOT_DIR, { prefix: '/uploads/' });
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Qosh API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();