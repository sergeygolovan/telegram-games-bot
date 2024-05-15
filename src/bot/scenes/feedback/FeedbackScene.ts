import { Injectable } from '@nestjs/common';
import {
  Action,
  Ctx,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { BotSceneContext, ViewCode } from 'src/bot/types';
import { Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { FEEDBACK_SCENE_ID } from './constants';
import { DONATIONS_SCENE_ID, DonationsSceneState } from '../donations';

@Injectable()
@Scene(FEEDBACK_SCENE_ID)
export class FeedbackScene extends ViewReplyBuilder {
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
      ViewCode.FEEDBACK_VIEW_BEFORE,
      {
        parse_mode: 'HTML',
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

  @On('message')
  async handleFeedbackMessage(@Ctx() ctx: BotSceneContext) {
    const text = ((ctx.message as any).text || '').trim();

    if (text) {
      try {
        await this.databaseService.feedback.create({
          data: {
            username: ctx.message.from.username,
            message: text,
          },
        });
      } catch (e) {
        console.error(e);
      }

      const message = await this.createViewReplyMessage(
        ctx,
        ViewCode.FEEDBACK_VIEW_AFTER,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                Markup.button.callback(
                  '🙏 Поблагодарить автора',
                  'nav_to_donations',
                ),
              ],
              [Markup.button.callback('⬅️ Назад', 'back')],
            ],
          },
        },
      );

      this.messages.push(message);
    }
  }

  @Action('nav_to_donations')
  async navToDonations(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter<DonationsSceneState>(DONATIONS_SCENE_ID, {
      prevScene: ctx.scene.state.prevScene,
    });
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
