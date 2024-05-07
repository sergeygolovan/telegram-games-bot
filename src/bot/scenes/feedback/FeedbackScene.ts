import { Injectable } from '@nestjs/common';
import {
  Action,
  Command,
  Ctx,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { DatabaseService } from 'src/database/database.service';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewCode } from 'src/types';
import { Markup } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { GREETINGS_SCENE_ID } from '../greetings';
import { Message } from 'telegraf/typings/core/types/typegram';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { FEEDBACK_SCENE_ID } from './constants';

@Injectable()
@Scene(FEEDBACK_SCENE_ID)
export class FeedbackScene extends ViewReplyBuilder {
  private messages: Message[] = [];

  constructor(
    private readonly databaseService: DatabaseService,
    protected readonly fileStorageService: FileStorageService,
  ) {
    super(fileStorageService);
  }

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    this.messages = [];

    const properties = await this.databaseService.getViewProperties(
      ViewCode.FEEDBACK_VIEW_BEFORE,
    );

    const message = await this.createViewReplyMessage(ctx, properties, {
      parse_mode: 'HTML',
    });

    this.messages.push(message);
  }

  @SceneLeave()
  async leave(@Ctx() ctx: SceneContext) {
    try {
      await ctx.deleteMessages(
        this.messages.map(({ message_id }) => message_id),
      );
    } catch (e) {
      console.error(e);
    }
  }

  @On('message')
  async handleFeedbackMessage(@Ctx() ctx: SceneContext) {
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

      const properties = await this.databaseService.getViewProperties(
        ViewCode.FEEDBACK_VIEW_AFTER,
      );

      const message = await this.createViewReplyMessage(ctx, properties, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('В главное меню', 'return')],
          ],
        },
      });

      this.messages.push(message);
    }
  }

  @Action('return')
  async returnToCategorySelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @Command('start')
  async exit(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(GREETINGS_SCENE_ID);
  }
}
