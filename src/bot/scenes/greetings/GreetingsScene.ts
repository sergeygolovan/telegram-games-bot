import { Injectable } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { GREETINGS_SCENE_ID } from './constants';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { BotSceneContext, ViewCode } from 'src/bot/types';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { Message } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';

@Injectable()
@Scene(GREETINGS_SCENE_ID)
export class GreetingsScene extends ViewReplyBuilder {
  private message: Message = null;

  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly fileStorageService: FileStorageService,
  ) {
    super(databaseService, fileStorageService);
  }

  @SceneEnter()
  async enter(@Ctx() ctx: BotSceneContext) {
    this.message = await this.createViewReplyMessage(
      ctx,
      ViewCode.GREETINGS_VIEW,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback(
                'Выбрать приставку',
                'show_console_selection',
              ),
            ],
          ],
        },
      },
    );
  }

  @Action('show_console_selection')
  async showConsoleSelection(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @SceneLeave()
  async leave(@Ctx() ctx: BotSceneContext) {
    if (this.message) {
      try {
        await ctx.deleteMessage(this.message.message_id);
        this.message = null;
      } catch (e) {
        console.error(e);
      }
    }
  }
}
