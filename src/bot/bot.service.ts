import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Command, Composer, Ctx, InjectBot, Start } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { GREETINGS_SCENE_ID } from './scenes/greetings';
import { FEEDBACK_SCENE_ID } from './scenes/feedback/constants';
import { BotSceneContext, BotSessionContext } from './types';
import { DONATIONS_SCENE_ID, DonationsSceneState } from './scenes/donations';
import { ConfigService } from '@nestjs/config';
import { getMinuteDiffBetweenDates } from './utils/getMinuteDiffBetweenDates';

@Composer()
@Injectable()
export class BotService implements OnModuleDestroy, OnModuleInit {
  protected logger = new Logger(BotService.name);
  constructor(
    private readonly configService: ConfigService,
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {
    this.bot.use(this.updateSession.bind(this));
  }

  async onModuleInit() {
    await this.bot.telegram.sendMessage(
      Number(this.configService.get('TELEGRAM_BOT_NOTIFICATION_USER_ID')),
      'Бот запущен (сгенерировано автоматически)',
    );
  }

  async onModuleDestroy() {
    await this.bot.telegram.sendMessage(
      Number(this.configService.get('TELEGRAM_BOT_NOTIFICATION_USER_ID')),
      'Бот остановлен (сгенерировано автоматически)',
    );
    this.bot.stop();
  }

  private async updateSession(ctx: BotSessionContext, next: any) {
    try {
      ctx.session.count = (ctx.session.count || 0) + 1;
      ctx.session.username = ctx.from.username;
      ctx.session.userId = ctx.from.id;
      ctx.session.chatId = ctx.chat.id;
      if (!ctx.session.sentMessageIds) {
        ctx.session.sentMessageIds = [];
      }
      if (ctx.message?.message_id) {
        ctx.session.sentMessageIds.push(ctx.message.message_id);
      }
      if (ctx.session.lastRequestDate) {
        const diff = getMinuteDiffBetweenDates(
          new Date(ctx.session.lastRequestDate),
          new Date(),
        );
        const sessionMaxTime = Number(
          this.configService.get(
            'TELEGRAM_BOT_MAX_SESSION_TIME_IN_MINUTES',
            30,
          ),
        );
        if (diff > sessionMaxTime) {
          ctx.session.sessionsCount = (ctx.session.sessionsCount || 0) + 1;
        }
      } else {
        ctx.session.sessionsCount = (ctx.session.sessionsCount || 0) + 1;
      }

      ctx.session.lastRequestDate = new Date();
    } catch (e) {
      this.logger.error(e);
      await this.bot.telegram.sendMessage(
        Number(this.configService.get('TELEGRAM_BOT_NOTIFICATION_USER_ID')),
        `<pre><code>${e}</code></pre>`,
        {
          parse_mode: 'HTML',
        },
      );
    }
    return next();
  }

  private async deletePreviouslySentMessages(ctx: BotSessionContext) {
    try {
      if (ctx.session.sentMessageIds?.length > 0) {
        await ctx.deleteMessages(ctx.session.sentMessageIds);
      }
    } catch (e) {
      await this.bot.telegram.sendMessage(
        Number(this.configService.get('TELEGRAM_BOT_NOTIFICATION_USER_ID')),
        `<pre><code>${e}</code></pre>`,
        {
          parse_mode: 'HTML',
        },
      );
    } finally {
      ctx.session.sentMessageIds = [];
    }
  }

  @Start()
  async start(@Ctx() ctx: BotSceneContext) {
    await this.deletePreviouslySentMessages(ctx);
    await ctx.scene.enter(GREETINGS_SCENE_ID);
  }

  @Command('feedback')
  async openFeedbackScene(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID);
  }

  @Command('donations')
  async openDonationsScene(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter<DonationsSceneState>(DONATIONS_SCENE_ID);
  }
}
