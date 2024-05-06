import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { session } from 'telegraf';
import { GameSelectionScene, CategorySelectionScene } from './scenes';
import { SearchGameScene } from './scenes/search/SearchGameScene';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          token: configService.get('TELEGRAM_BOT_TOKEN'),
          middlewares: [session()],
        };
      },
    }),
  ],
  providers: [
    BotService,
    CategorySelectionScene,
    GameSelectionScene,
    SearchGameScene,
  ],
  exports: [BotService],
})
export class BotModule {}
