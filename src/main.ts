import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  process.on('SIGINT', async () => {
    await app.close();
    setTimeout(() => {
      process.exit(0);
    });
  });
  process.on('SIGTERM', async () => {
    await app.close();
    setTimeout(() => {
      process.exit(0);
    });
  });

  process.on('uncaughtException', async (e) => {
    console.error(e);
    await app.close();
    setTimeout(() => {
      process.exit(1);
    });
  });

  process.on('unhandledRejection', async (e) => {
    console.error(e);
    await app.close();
    setTimeout(() => {
      process.exit(1);
    });
  });

  await app.listen(3000);
}
bootstrap();
