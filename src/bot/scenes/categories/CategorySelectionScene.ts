import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene } from 'nestjs-telegraf';
import { DatabaseService } from 'src/database/database.service';
import { CATEGORY_SELECTION_SCENE_ID } from './constants';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import {
  CategorySelectionSceneContext,
  ICategoryDataMarkup,
  CategoryWithGames,
  CategorySelectionSceneHierNode,
  CategoryHierWithGames,
} from './types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { SEARCH_GAME_SCENE_ID } from '../search/constants';
import { Markup } from 'telegraf';
import { FEEDBACK_SCENE_ID } from '../feedback';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { ViewCode } from 'src/bot/types';
import { SearchGameSceneState } from '../search';
import { AbstractFolderTreeScene, HierDatasetStructure } from '../core';
import { Game } from '@prisma/client';
import { DONATIONS_SCENE_ID, DonationsSceneState } from '../donations';

@Scene(CATEGORY_SELECTION_SCENE_ID)
@Injectable()
export class CategorySelectionScene extends AbstractFolderTreeScene<
  CategoryHierWithGames,
  CategoryWithGames,
  Game
> {
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

  protected async fetchCurrentNodeData(
    ctx: CategorySelectionSceneContext,
    id: number | null,
  ): Promise<CategoryHierWithGames> {
    if (id === null) {
      return null;
    }

    return this.databaseService.category.findUnique({
      include: {
        games: {
          orderBy: {
            name: 'asc',
          },
        },
        children: {
          include: {
            games: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      where: {
        id,
      },
    });
  }

  protected async getRootDatasetStructure(): Promise<
    HierDatasetStructure<CategoryWithGames, Game>
  > {
    const categories = await this.databaseService.category.findMany({
      include: {
        games: true,
      },
      where: {
        parentId: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
    const games = await this.databaseService.game.findMany({
      where: {
        categoryId: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      parents: categories,
      leafs: games,
    };
  }

  protected async getNodeDatasetStructure(): Promise<HierDatasetStructure> {
    return {
      parents: this.currentNodeData.children,
      leafs: this.currentNodeData.games,
    };
  }

  protected getParentNodeButtonMarkup(
    category: CategoryWithGames,
  ): InlineKeyboardButton {
    const workInProgressText = ' (в разработке)';
    const gamesCount = ` (${category.games.length} игр)`;
    return Markup.button.callback(
      `📂 ${category.name}${category.isWorkInProgress ? workInProgressText : gamesCount}`,
      `${category.id}`,
    );
  }

  protected getLeafNodeButtonMarkup(game: Game): InlineKeyboardButton {
    return Markup.button.url(`🎮 ${game.name}`, game.url);
  }

  protected async getDataMarkup(
    ctx: CategorySelectionSceneContext,
    data: CategorySelectionSceneHierNode[],
  ): Promise<ICategoryDataMarkup> {
    const { text, image } =
      await this.viewReplyBuilder.getViewReplyMessageMarkup(
        ctx,
        ViewCode.CATEGORY_SELECTION_VIEW,
        {
          description: this.currentNodeData?.description,
          image: this.currentNodeData?.image,
        },
      );

    const extraText = `\n\n<i>Для навигации используй кнопки <b>Вперед</b> и <b>Назад</b>, или напиши часть названия игры в чат и мы попробуем найти её в нашей коллекции</i> ✌🏻`;
    const pageNumberText =
      this.pageCount > 1
        ? `\n(страница ${this.pageNumber} из ${this.pageCount})`
        : ``;
    const categoryText = this.currentNodeData
      ? `Категория: <b><u>${this.currentNodeData.name}</u></b>\n\n`
      : '';

    return {
      text: categoryText + text + extraText + pageNumberText,
      image,
      buttons: this.getDataMarkupButtons(ctx, data),
    };
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    if (this.currentNodeData === null) {
      return [
        [
          Markup.button.url(
            '🔄 Новости и Обновления',
            'https://t.me/gamebase54',
          ),
        ],
        [Markup.button.callback('👻 Оставить отзыв', 'nav_to_feedback')],
        [Markup.button.callback('🙏 Помощь проекту', 'nav_to_donations')],
      ];
    }
    return [];
  }

  protected createReplyMessage(
    ctx: CategorySelectionSceneContext,
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
    ctx: CategorySelectionSceneContext,
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

  private async createEmptyListReplyMessage(
    ctx: CategorySelectionSceneContext,
  ) {
    return this.viewReplyBuilder.createViewReplyMessage(
      ctx,
      ViewCode.EMPTY_CATEGORY_LIST_VIEW,
      {
        parse_mode: 'HTML',
      },
    );
  }

  @Action('nav_to_feedback')
  async navToFeedback(@Ctx() ctx: CategorySelectionSceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID, {
      prevScene: {
        id: CATEGORY_SELECTION_SCENE_ID,
        state: ctx.scene.state,
      },
    });
  }

  @Action('nav_to_donations')
  async navToDonations(@Ctx() ctx: CategorySelectionSceneContext) {
    await ctx.scene.enter<DonationsSceneState>(DONATIONS_SCENE_ID, {
      prevScene: {
        id: CATEGORY_SELECTION_SCENE_ID,
        state: ctx.scene.state,
      },
    });
  }

  @On('message')
  async searchGame(@Ctx() ctx: CategorySelectionSceneContext) {
    await ctx.scene.enter<SearchGameSceneState>(SEARCH_GAME_SCENE_ID, {
      query: (ctx.message as any).text,
      categoryId: this.currentNodeData?.id || null,
      prevScene: {
        id: CATEGORY_SELECTION_SCENE_ID,
        state: { ...ctx.scene.session.state },
      },
    });
  }
}
