import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { CategorySelectionScene } from './scenes';
import { SearchGameScene } from './scenes/search/SearchGameScene';
import { GreetingsScene } from './scenes/greetings';
import { FeedbackScene } from './scenes/feedback/FeedbackScene';
import { Context, session } from 'telegraf';
import { SQLite } from '@telegraf/session/sqlite';
import { BotSceneSession } from './types';
import { DonationsScene } from './scenes/donations';

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
              defaultSession: (ctx: Context): BotSceneSession => ({
                username: ctx.from.username,
                count: 0,
                userId: ctx.from.id,
                chatId: ctx.chat.id,
                lastRequestDate: new Date(),
                sessionsCount: 0,
                sentMessageIds: [],
                state: {},
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
    SearchGameScene,
    FeedbackScene,
    DonationsScene,
  ],
  exports: [BotService],
})
export class BotModule {}
