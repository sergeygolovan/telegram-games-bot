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
import { injectUserVariables } from 'src/bot/utils/injectUserVariables';
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
    this.viewReplyBuilder = new ViewReplyBuilder(fileStorageService);
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
    data: CategoryWithGames[],
  ): Promise<ICategoryDataMarkup> {
    const properties = await this.databaseService.getViewProperties(
      ViewCode.CATEGORY_SELECTION_VIEW,
    );

    return {
      text:
        properties.description ||
        'Выбери приставку или отправь часть названия игры',
      image: await this.getDataMarkupImage(properties.image),
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

  private async getDataMarkupImage(image: string) {
    if (image) {
      return this.fileStorageService.getObject(image);
    }
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

    const transforedText = injectUserVariables(ctx, text);

    if (!image) {
      return ctx.reply(transforedText, commonOptions);
    }

    return ctx.sendPhoto(
      {
        source: image,
      },
      {
        caption: transforedText,
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
    const transforedText = injectUserVariables(ctx, text);
    const commonOptions: ExtraEditMessageText = {
      parse_mode: 'HTML',
      reply_markup: markup,
    };

    if (!image) {
      await ctx.editMessageText(transforedText, commonOptions);
    } else {
      await ctx.editMessageCaption(transforedText, commonOptions);
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
