import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { session } from 'telegraf';
import { GameSelectionScene, CategorySelectionScene } from './scenes';
import { SearchGameScene } from './scenes/search/SearchGameScene';
import { GreetingsScene } from './scenes/greetings';
import { FeedbackScene } from './scenes/feedback/FeedbackScene';

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
    GreetingsScene,
    CategorySelectionScene,
    GameSelectionScene,
    SearchGameScene,
    FeedbackScene,
  ],
  exports: [BotService],
})
export class BotModule {}
