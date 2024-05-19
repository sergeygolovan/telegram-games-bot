import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Command,
  Composer,
  Ctx,
  InjectBot,
  Next,
  Start,
} from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { GREETINGS_SCENE_ID } from './scenes/greetings';
import { FEEDBACK_SCENE_ID } from './scenes/feedback/constants';
import { BotSceneContext, BotSessionContext } from './types';
import { DONATIONS_SCENE_ID, DonationsSceneState } from './scenes/donations';
import { ConfigService } from '@nestjs/config';
import { getMinuteDiffBetweenDates } from './utils/getMinuteDiffBetweenDates';
import { DatabaseService } from 'src/database/database.service';
import { Cron } from '@nestjs/schedule';

@Composer()
@Injectable()
export class BotService implements OnModuleDestroy, OnModuleInit {
  protected logger = new Logger(BotService.name);
  private notificationUserIds: number[] = [];
  private sessionMaxTime: number = 30;
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {
    this.bot.use(this.updateSession.bind(this));
  }

  async onModuleInit() {
    this.notificationUserIds = JSON.parse(
      this.configService.get('TELEGRAM_BOT_NOTIFICATION_USERS_ID', '[]'),
    );
    this.sessionMaxTime = Number(
      this.configService.get('TELEGRAM_BOT_MAX_SESSION_TIME_IN_MINUTES', 30),
    );
    this.notificationUserIds.forEach(async (userId) => {
      try {
        await this.bot.telegram.sendMessage(
          userId,
          'Бот запущен (сгенерировано автоматически)',
        );
      } catch (e) {
        this.logger.error(e);
      }
    });
  }

  async onModuleDestroy() {
    this.notificationUserIds.forEach(async (userId) => {
      try {
        await this.bot.telegram.sendMessage(
          userId,
          'Бот остановлен (сгенерировано автоматически)',
        );
      } catch (e) {
        this.logger.error(e);
      }
    });
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
        if (diff > this.sessionMaxTime) {
          ctx.session.sessionsCount = (ctx.session.sessionsCount || 0) + 1;
        }
      } else {
        ctx.session.sessionsCount = (ctx.session.sessionsCount || 0) + 1;
      }

      ctx.session.lastRequestDate = new Date();
    } catch (e) {
      this.logger.error(e);
    }
    return next();
  }

  private async deletePreviouslySentMessages(ctx: BotSessionContext) {
    try {
      if (ctx.session.sentMessageIds?.length > 0) {
        await ctx.deleteMessages(ctx.session.sentMessageIds);
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      ctx.session.sentMessageIds = [];
    }
  }

  private async getSessionStatsMessageText() {
    const stats = await this.databaseService.getSessionStats();

    if (stats.length === 0) {
      return `<b>Записи отсутствуют</b>`;
    }

    const uniqueUsersCount = stats.length;
    const totalRequestsCount = stats.reduce(
      (result, { session }) => result + (session.count || 0),
      0,
    );
    const lastRequestSession = stats[0].session;

    return (
      `<i>Уникальных пользователей:</i> <b>${uniqueUsersCount}</b>\n` +
      `<i>Общее количество запросов:</i> <b>${totalRequestsCount}</b>\n` +
      `<i>Последняя сессия:</i> <b>${lastRequestSession.lastRequestDate.toLocaleString()}</b> (${lastRequestSession.username || 'Аноним'}, id: ${lastRequestSession.userId})`
    );
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

  @Command('stats')
  async showStatistics(@Ctx() ctx: BotSceneContext, @Next() next: any) {
    if (this.notificationUserIds.includes(ctx.from.id)) {
      const sessionStatsText = await this.getSessionStatsMessageText();
      await ctx.reply(sessionStatsText, {
        parse_mode: 'HTML',
      });
    } else {
      next();
    }
  }

  @Cron('*/30 * * * * *')
  async sendNotifications() {
    const notification = await this.databaseService.pullNotification();

    if (!notification) {
      return;
    }

    const stats = await this.databaseService.getSessionStats();
    const receiverIds = stats
      .filter(({ session }) => {
        if (session.lastRequestDate) {
          const diff = getMinuteDiffBetweenDates(
            new Date(session.lastRequestDate),
            new Date(),
          );
          return diff < this.sessionMaxTime;
        }
      })
      .map(({ session }) => session.userId);

    try {
      await Promise.allSettled(
        receiverIds.map((id) =>
          this.bot.telegram.sendMessage(id, notification.message, {
            parse_mode: 'HTML',
          }),
        ),
      );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
