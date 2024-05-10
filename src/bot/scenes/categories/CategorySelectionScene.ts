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
import { AbstractHierarchyTreeScene } from '../core';
import { Category, Game } from '@prisma/client';
import {
  HierarchyTreeLeafNode,
  HierarchyTreeParentNode,
} from '../core/AbstractHierarchyTreeScene/types';

@Scene(CATEGORY_SELECTION_SCENE_ID)
@Injectable()
export class CategorySelectionScene extends AbstractHierarchyTreeScene<
  CategoryWithGames,
  Game
> {
  private viewReplyBuilder: ViewReplyBuilder;
  private selectedCategory: Category;

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

  protected async getDataset(
    ctx: CategorySelectionSceneContext,
  ): Promise<CategorySelectionSceneHierNode[]> {
    const currentNodeId = ctx.scene.state.nodeId;

    if (currentNodeId) {
      return this.getSelectedNodeDataset(ctx);
    }
    return this.getRootNodeDataset();
  }

  private async getRootNodeDataset(): Promise<
    CategorySelectionSceneHierNode[]
  > {
    this.selectedCategory = null;
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
    const categoryNodes: HierarchyTreeParentNode<CategoryWithGames>[] =
      categories.map((category) => ({
        type: 'parent',
        id: category.id,
        parentId: null,
        data: category,
      }));
    const gameNodes: HierarchyTreeLeafNode<Game>[] = games.map((game) => ({
      type: 'leaf',
      id: game.id,
      parentId: null,
      data: game,
    }));

    return [...categoryNodes, ...gameNodes];
  }

  private async getSelectedNodeDataset(
    ctx: CategorySelectionSceneContext,
  ): Promise<CategorySelectionSceneHierNode[]> {
    const currentNodeId = ctx.scene.state.nodeId;
    const currentNode = await this.databaseService.category.findUnique({
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
        id: currentNodeId,
      },
    });

    this.selectedCategory = currentNode;

    const categoryNodes: HierarchyTreeParentNode<CategoryWithGames>[] =
      currentNode.children.map((category) => ({
        type: 'parent',
        id: category.id,
        parentId: currentNodeId,
        data: category,
      }));
    const gameNodes: HierarchyTreeLeafNode<Game>[] = currentNode.games.map(
      (game) => ({
        type: 'leaf',
        id: game.id,
        parentId: currentNodeId,
        data: game,
      }),
    );

    return [...categoryNodes, ...gameNodes];
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
          description: this.selectedCategory?.description,
          image: this.selectedCategory?.image,
        },
      );

    return {
      text,
      image,
      buttons: this.getDataMarkupButtons(ctx, data),
    };
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    return [[Markup.button.callback('👻 Оставить отзыв', 'nav_to_feedback')]];
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
    return ctx.reply(
      'Пока что список приставок пуст 😱.\nВозможно, произошла внутренняя ошибка. Вскоре мы все исправим!',
    );
  }

  @Action(/[\d]+/)
  async openCategory(@Ctx() ctx: CategorySelectionSceneContext) {
    const categoryId = Number((ctx as any).match[0]);
    ctx.scene.state.parentNodeId = ctx.scene.state.nodeId;
    ctx.scene.state.nodeId = categoryId;
    await ctx.scene.reenter();
  }

  @Action('nav_to_feedback')
  async navToFeedback(@Ctx() ctx: CategorySelectionSceneContext) {
    await ctx.scene.enter(FEEDBACK_SCENE_ID);
  }

  @On('message')
  async searchGame(@Ctx() ctx: CategorySelectionSceneContext) {
    await ctx.scene.enter<SearchGameSceneState>(SEARCH_GAME_SCENE_ID, {
      query: (ctx.message as any).text,
      prevScene: {
        id: CATEGORY_SELECTION_SCENE_ID,
        state: { ...ctx.scene.session.state },
      },
    });
  }
}
