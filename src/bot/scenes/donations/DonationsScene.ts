import { Injectable } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { DONATIONS_SCENE_ID } from './constants';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { Message } from 'telegraf/typings/core/types/typegram';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { BotSceneContext, ViewCode } from 'src/bot/types';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { Markup } from 'telegraf';

@Injectable()
@Scene(DONATIONS_SCENE_ID)
export class DonationsScene extends ViewReplyBuilder {
  private messages: Message[] = [];

  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly fileStorageService: FileStorageService,
  ) {
    super(databaseService, fileStorageService);
  }

  @SceneEnter()
  async enter(@Ctx() ctx: BotSceneContext) {
    this.messages = [];

    const message = await this.createViewReplyMessage(
      ctx,
      ViewCode.DONATIONS_VIEW,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('⬅️ Назад', 'back')]],
        },
      },
    );

    this.messages.push(message);
  }

  @SceneLeave()
  async leave(@Ctx() ctx: BotSceneContext) {
    try {
      await ctx.deleteMessages(
        this.messages.map(({ message_id }) => message_id),
      );
    } catch (e) {
      console.error(e);
    }
  }

  @Action('back')
  async navBackToPreviousScene(@Ctx() ctx: BotSceneContext) {
    const prevScene = ctx.scene.state.prevScene || {
      id: CATEGORY_SELECTION_SCENE_ID,
      state: {},
    };
    await ctx.scene.enter(prevScene.id, prevScene.state);
  }
}
