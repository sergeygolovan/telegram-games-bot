import { Action, Ctx, On, Scene } from 'nestjs-telegraf';
import Fuse from 'fuse.js';
import { SEARCH_GAME_SCENE_ID } from './constants';
import { DatabaseService } from 'src/database/database.service';
import { SceneContext, SceneSessionData } from 'telegraf/typings/scenes';
import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
import { Markup } from 'telegraf';
import { AbstractPaginatedListScene } from '../core';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { ISearchGameDataMarkup } from './types';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { ViewCode } from 'src/types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { injectUserVariables } from 'src/bot/utils/injectUserVariables';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';

@Scene(SEARCH_GAME_SCENE_ID)
@Injectable()
export class SearchGameScene extends AbstractPaginatedListScene<Game> {
  private viewReplyBuilder: ViewReplyBuilder;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(10);
    this.viewReplyBuilder = new ViewReplyBuilder(fileStorageService);
  }

  protected async getDataset(ctx: SceneContext): Promise<Game[]> {
    const query: string = (ctx.scene.state['query'] || '').trim();

    if (!query) {
      return [];
    }

    const games = await this.databaseService.game.findMany();

    const fuse = new Fuse(games, {
      keys: ['name'],
      threshold: 0.3,
    });

    const items = fuse.search(query, {
      limit: 6,
    });

    return items.map(({ item }) => item);
  }

  protected async getDataMarkup(data: Game[]): Promise<ISearchGameDataMarkup> {
    const properties = await this.databaseService.getViewProperties(
      ViewCode.GAME_SEARCH_RESULTS_VIEW,
    );

    return {
      text:
        properties.description || 'Мы нашли следующие игры по твоему запросу:',
      image: await this.getDataMarkupImage(properties.image),
      buttons: data.map((game) => [
        {
          text: game.name,
          url: game.url,
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
    return [[Markup.button.callback('Вернуться к списку приставок', 'back')]];
  }

  protected async createReplyMessage(
    ctx: SceneContext<SceneSessionData>,
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
    ctx: SceneContext<SceneSessionData>,
    markup: InlineKeyboardMarkup,
    dataMarkup: ISearchGameDataMarkup,
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

  private async createEmptyListReplyMessage(
    ctx: SceneContext,
    markup: InlineKeyboardMarkup,
  ): Promise<Message> {
    const properties = await this.databaseService.getViewProperties(
      ViewCode.EMPTY_GAME_SEARCH_RESULTS_VIEW,
    );
    return this.viewReplyBuilder.createViewReplyMessage(ctx, properties, {
      parse_mode: 'HTML',
      reply_markup: markup,
    });
  }

  @Action('back')
  async returnToCategorySelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @On('message')
  async reenter(@Ctx() ctx: SceneContext) {
    ctx.scene.state['query'] = (ctx.message as any).text;
    await ctx.scene.reenter();
  }
}
