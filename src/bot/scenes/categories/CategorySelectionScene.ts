import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene } from 'nestjs-telegraf';
import { DatabaseService } from 'src/database/database.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { GAME_SELECTION_SCENE_ID } from '../game';
import { CATEGORY_SELECTION_SCENE_ID } from './constants';
import { AbstractPaginatedListScene } from '../core';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { CategoryWithGames, ICategoryDataMarkup } from './types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { SEARCH_GAME_SCENE_ID } from '../search/constants';
import { Markup } from 'telegraf';
import { FEEDBACK_SCENE_ID } from '../feedback';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewCode } from 'src/types';

@Scene(CATEGORY_SELECTION_SCENE_ID)
@Injectable()
export class CategorySelectionScene extends AbstractPaginatedListScene<CategoryWithGames> {
  private viewReplyBuilder: ViewReplyBuilder;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(8);
    this.viewReplyBuilder = new ViewReplyBuilder(
      databaseService,
      fileStorageService,
    );
  }

  protected async getDataset(): Promise<CategoryWithGames[]> {
    return this.databaseService.category.findMany({
      include: {
        games: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  protected async getDataMarkup(
    ctx: SceneContext,
    data: CategoryWithGames[],
  ): Promise<ICategoryDataMarkup> {
    const { text, image } =
      await this.viewReplyBuilder.getViewReplyMessageMarkup(
        ctx,
        ViewCode.CATEGORY_SELECTION_VIEW,
      );

    return {
      text,
      image,
      buttons: data.map((category) => [
        {
          text:
            category.name +
            (category.isWorkInProgress
              ? ' (в разработке)'
              : ` (${category.games.length} игр)`),
          callback_data: `${category.id}`,
        },
      ]),
    };
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    return [[Markup.button.callback('👻 Оставить отзыв', 'nav_to_feedback')]];
  }

  protected createReplyMessage(
    ctx: SceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: ICategoryDataMarkup,
  ): Promise<Message> {
    const { text, image, buttons } = dataMarkup;
    const commonOptions: ExtraReplyMessage = {
      parse_mode: 'HTML',
      reply_markup: markup,
    };

    if (buttons.length === 0) {
      return this.createEmptyListReplyMessage(ctx);
    }

    if (!image) {
      return ctx.reply(text, commonOptions);
    }

    return ctx.sendPhoto(
      {
        source: image,
      },
      {
        caption: text,
        ...commonOptions,
      },
    );
  }
  protected async editReplyMessage(
    ctx: SceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: ICategoryDataMarkup,
  ): Promise<void> {
    const { text, image } = dataMarkup;
    const commonOptions: ExtraEditMessageText = {
      parse_mode: 'HTML',
      reply_markup: markup,
    };

    if (!image) {
      await ctx.editMessageText(text, commonOptions);
    } else {
      await ctx.editMessageCaption(text, commonOptions);
    }
  }

  private async createEmptyListReplyMessage(ctx: SceneContext) {
    return ctx.reply(
      'Пока что список приставок пуст 😱.\nВозможно, произошла внутренняя ошибка. Вскоре мы все исправим!',
    );
  }

  @Action(/[\d]+/)
  async showGamesFor(@Ctx() ctx: SceneContext) {
    const categoryId = Number((ctx as any).match[0]);
    await ctx.scene.enter(GAME_SELECTION_SCENE_ID, {
      categoryId,
    });
  }

  @Action('nav_to_feedback')
  async navToFeedback(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID);
  }

  @On('message')
  async searchGame(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(SEARCH_GAME_SCENE_ID, {
      query: (ctx.message as any).text,
    });
  }
}
