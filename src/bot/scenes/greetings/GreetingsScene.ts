import { Injectable } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { GREETINGS_SCENE_ID } from './constants';
import { SceneContext } from 'telegraf/typings/scenes';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { ViewCode } from 'src/types';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { Message } from 'telegraf/typings/core/types/typegram';

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
  async enter(@Ctx() ctx: SceneContext) {
    this.message = await this.createViewReplyMessage(
      ctx,
      ViewCode.GREETINGS_VIEW,
      {
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
      },
    );
  }

  @Action('show_console_selection')
  async showConsoleSelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @SceneLeave()
  async leave(@Ctx() ctx: SceneContext) {
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
