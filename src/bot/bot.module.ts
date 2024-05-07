import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { GameSelectionScene, CategorySelectionScene } from './scenes';
import { SearchGameScene } from './scenes/search/SearchGameScene';
import { GreetingsScene } from './scenes/greetings';
import { FeedbackScene } from './scenes/feedback/FeedbackScene';
import { Context, session } from 'telegraf';
import { SQLite } from '@telegraf/session/sqlite';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const store = SQLite({
          filename: configService.get('SESSION_DB_FILE'),
        });
        return {
          token: configService.get('TELEGRAM_BOT_TOKEN'),
          middlewares: [
            session({
              store,
              defaultSession: (ctx: Context) => ({
                username: ctx.from.username,
                count: 0,
              }),
            }),
          ],
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
