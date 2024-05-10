import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Command, Composer, Ctx, InjectBot, Start } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { GREETINGS_SCENE_ID } from './scenes/greetings';
import { FEEDBACK_SCENE_ID } from './scenes/feedback/constants';
import { BotSceneContext, BotSessionContext } from './types';

@Composer()
@Injectable()
export class BotService implements OnModuleDestroy {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {
    this.bot.use(async (ctx: BotSessionContext, next: any) => {
      ctx.session.count += 1;
      ctx.session.username = ctx.from.username;
      ctx.session.userId = ctx.from.id;
      ctx.session.chatId = ctx.chat.id;
      if (!ctx.session.sentMessageIds) {
        ctx.session.sentMessageIds = [];
      }
      if (ctx.message) {
        ctx.session.sentMessageIds.push(ctx.message.message_id);
      }
      ctx.session.lastRequestDate = new Date();
      return next();
    });
  }

  async onModuleDestroy() {
    this.bot.stop();
  }

  private async deletePreviouslySentMessages(ctx: BotSessionContext) {
    await ctx.deleteMessages(ctx.session.sentMessageIds);
    ctx.session.sentMessageIds = [];
  }

  @Start()
  async start(@Ctx() ctx: BotSceneContext) {
    try {
      await this.deletePreviouslySentMessages(ctx);
    } catch (e) {
      console.error(e);
    }
    await ctx.scene.enter(GREETINGS_SCENE_ID);
  }

  @Command('feedback')
  async openFeedbackScene(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID);
  }
}
