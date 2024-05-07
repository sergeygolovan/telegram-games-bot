import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Command, Composer, Ctx, InjectBot, Start } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { GREETINGS_SCENE_ID } from './scenes/greetings';
import { FEEDBACK_SCENE_ID } from './scenes/feedback/constants';

@Composer()
@Injectable()
export class BotService implements OnModuleDestroy {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {}

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
