import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so the Next.js frontend can connect
  app.enableCors({
    origin: '*', // In production, replace with frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  // Run Gateway on port 3001 to avoid conflicts with frontend (3000) and ML service (8000)
  await app.listen(3001);
  console.log('✅ API Gateway is running on http://localhost:3001');
}
bootstrap();
