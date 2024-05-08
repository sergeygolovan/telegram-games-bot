import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Command, Composer, Ctx, InjectBot, Start } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { GREETINGS_SCENE_ID } from './scenes/greetings';
import { FEEDBACK_SCENE_ID } from './scenes/feedback/constants';
import { SessionContext } from 'telegraf/typings/session';

@Composer()
@Injectable()
export class BotService implements OnModuleDestroy {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {
    this.bot.use(async (ctx: SessionContext<any>, next: any) => {
      ctx.session.count += 1;
      ctx.session.username = ctx.from.username;
      ctx.session.user_id = ctx.from.id;
      ctx.session.chat_id = ctx.chat.id;
      ctx.session.lastRequestDate = new Date();
      return next();
    });
  }

  async onModuleDestroy() {
    this.bot.stop();
  }

  @Start()
  async start(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(GREETINGS_SCENE_ID);
  }

  @Command('feedback')
  async openFeedbackScene(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID);
  }
}
