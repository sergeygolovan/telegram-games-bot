import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    FileStorageModule,
    ScheduleModule.forRoot(),
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
