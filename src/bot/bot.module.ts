import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { CategorySelectionScene } from './scenes';
import { SearchGameScene } from './scenes/search/SearchGameScene';
import { GreetingsScene } from './scenes/greetings';
import { FeedbackScene } from './scenes/feedback/FeedbackScene';
import { Context, session } from 'telegraf';
import { BotSceneSession, BotSessionContext } from './types';
import { DonationsScene } from './scenes/donations';
import { SessionService } from './session.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, BotModule],
      inject: [ConfigService, SessionService],
      useFactory: (
        configService: ConfigService,
        sessionService: SessionService,
      ) => {
        return {
          token: configService.get('TELEGRAM_BOT_TOKEN'),
          middlewares: [
            session<BotSceneSession, BotSessionContext>({
              store: sessionService,
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
    SessionService,
    BotService,
    GreetingsScene,
    CategorySelectionScene,
    SearchGameScene,
    FeedbackScene,
    DonationsScene,
  ],
  exports: [BotService, SessionService],
})
export class BotModule {}
