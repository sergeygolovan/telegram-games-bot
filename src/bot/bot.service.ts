import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Action,
  Command,
  Ctx,
  InjectBot,
  Start,
  Update,
} from 'nestjs-telegraf';
import { DatabaseService } from 'src/database/database.service';
import { Context, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { CATEGORY_SELECTION_SCENE_ID } from './scenes';
import { ViewCode } from '../types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Update()
@Injectable()
export class BotService extends ViewReplyBuilder implements OnModuleDestroy {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly databaseService: DatabaseService,
    protected readonly fileStorageService: FileStorageService,
  ) {
    super(fileStorageService);
  }

  async onModuleDestroy() {
    this.bot.stop();
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.showGreetings(ctx);
  }

  private async showGreetings(ctx: Context) {
    const properties = await this.databaseService.getViewProperties(
      ViewCode.GREETINGS_VIEW,
    );

    await this.createViewReplyMessage(ctx, properties, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Выбрать приставку',
              callback_data: 'show_console_selection',
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
  }

  @Action('show_console_selection')
  async showConsoleSelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @Command('restart')
  async restart(@Ctx() ctx: SceneContext) {
    await ctx.scene.leave();
    await this.showGreetings(ctx);
  }
}
