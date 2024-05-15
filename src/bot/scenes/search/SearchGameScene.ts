import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import { Action, Ctx, On, Scene } from 'nestjs-telegraf';
import Fuse from 'fuse.js';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { ViewCode } from 'src/bot/types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { DatabaseService } from 'src/database/database.service';
import { SEARCH_GAME_SCENE_ID } from './constants';
import { AbstractPaginatedListScene } from '../core';
import {
  GameWithCategory,
  ISearchGameDataMarkup,
  SearchGameSceneContext,
} from './types';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';

@Scene(SEARCH_GAME_SCENE_ID)
@Injectable()
export class SearchGameScene extends AbstractPaginatedListScene<GameWithCategory> {
  private viewReplyBuilder: ViewReplyBuilder;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(10);
    this.viewReplyBuilder = new ViewReplyBuilder(
      databaseService,
      fileStorageService,
    );
  }

  protected async fetchDataset(
    ctx: SearchGameSceneContext,
  ): Promise<GameWithCategory[]> {
    const query: string = (ctx.scene.state.query || '').trim();
    const categoryId = ctx.scene.state.categoryId;

    if (!query) {
      return [];
    }

    const whereOptions: Prisma.GameWhereInput = {};

    if (categoryId) {
      whereOptions.categoryId = categoryId;
    }

    const games = await this.databaseService.game.findMany({
      include: {
        category: true,
      },
      where: whereOptions,
    });

    const fuse = new Fuse(games, {
      keys: ['name'],
      threshold: 0.2,
    });

    const items = fuse.search(query, {
      limit: 6,
    });

    return items.map(({ item }) => item);
  }

  protected async getDataMarkup(
    ctx: SearchGameSceneContext,
    data: GameWithCategory[],
  ): Promise<ISearchGameDataMarkup> {
    const markup = await this.viewReplyBuilder.getViewReplyMessageMarkup(
      ctx,
      ViewCode.GAME_SEARCH_RESULTS_VIEW,
      {
        description: 'Мы нашли следующие игры по твоему запросу:',
      },
    );

    return {
      ...markup,
      buttons: data.map((game) => [
        {
          text: `${game.name} (${game.category.name})`,
          url: game.url,
        },
      ]),
    };
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    return [[Markup.button.callback('Вернуться', 'back')]];
  }

  protected async createReplyMessage(
    ctx: SearchGameSceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: ISearchGameDataMarkup,
  ): Promise<Message> {
    const { text, image, buttons } = dataMarkup;
    const commonOptions: ExtraReplyMessage = {
      parse_mode: 'HTML',
      reply_markup: markup,
    };

    if (buttons.length === 0) {
      return this.createEmptyListReplyMessage(ctx, markup);
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
    ctx: SearchGameSceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: ISearchGameDataMarkup,
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
    ctx: SearchGameSceneContext,
    markup: InlineKeyboardMarkup,
  ): Promise<Message> {
    return this.viewReplyBuilder.createViewReplyMessage(
      ctx,
      ViewCode.EMPTY_GAME_SEARCH_RESULTS_VIEW,
      {
        parse_mode: 'HTML',
        reply_markup: markup,
      },
    );
  }

  @Action('back')
  async navBackToPreviousScene(@Ctx() ctx: SearchGameSceneContext) {
    const prevScene = ctx.scene.state.prevScene || {
      id: CATEGORY_SELECTION_SCENE_ID,
      state: {},
    };
    await ctx.scene.enter(prevScene.id, prevScene.state);
  }

  @On('message')
  async reenter(@Ctx() ctx: SearchGameSceneContext) {
    ctx.scene.state.query = (ctx.message as any).text;
    await ctx.scene.reenter();
  }
}
