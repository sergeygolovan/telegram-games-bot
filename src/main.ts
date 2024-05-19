import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const exitWithCode =
    (code: number) =>
    async (...args) => {
      console.log(args);
      await app.close();
      setTimeout(() => {
        process.exit(code);
      });
    };

  process.on('SIGINT', exitWithCode(0));
  process.on('SIGTERM', exitWithCode(0));
  process.on('uncaughtException', exitWithCode(1));
  process.on('unhandledRejection', exitWithCode(1));

  await app.listen(3002);
}
bootstrap();
