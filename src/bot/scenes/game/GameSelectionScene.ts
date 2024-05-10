import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
import { Action, Ctx, On, Scene } from 'nestjs-telegraf';
import { DatabaseService } from 'src/database/database.service';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { AbstractPaginatedListScene } from '../core/AbstractPaginatedListScene';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { GAME_SELECTION_SCENE_ID } from './constants';
import { GameSelectionSceneContext, IGameDataMarkup } from './types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { BotSceneContext, ViewCode } from 'src/bot/types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { SEARCH_GAME_SCENE_ID, SearchGameSceneState } from '../search';

@Injectable()
@Scene(GAME_SELECTION_SCENE_ID)
export class GameSelectionScene extends AbstractPaginatedListScene<Game> {
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

  protected async getDataset(ctx: GameSelectionSceneContext): Promise<Game[]> {
    const categoryId = ctx.scene.state.categoryId;

    return this.databaseService.game.findMany({
      where: {
        categoryId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  protected async getDataMarkup(
    ctx: GameSelectionSceneContext,
    data: Game[],
  ): Promise<IGameDataMarkup> {
    const categoryId = ctx.scene.state.categoryId;
    const { description, image } =
      await this.databaseService.category.findUniqueOrThrow({
        where: { id: categoryId },
      });

    const markup = await this.viewReplyBuilder.getViewReplyMessageMarkup(
      ctx,
      ViewCode.DEFAULT_CATEGORY_VIEW,
      {
        description,
        image,
      },
    );

    markup.text = this.getDataMarkupText(markup.text);

    const buttons = data.map((game) => [
      {
        text: game.name,
        url: game.url,
      },
    ]);

    return {
      ...markup,
      buttons,
    };
  }

  private getDataMarkupText(defaultText?: string): string {
    let text =
      defaultText || 'Ниже представлен список игр для выбранной консоли';
    const extraText =
      `Для поиска игры используй кнопки "Вперед" или "Назад"\n` +
      `(страница ${this.pageNumber} из ${this.pageCount})`;

    if (this.pageCount > 1) {
      text += '\n\n' + extraText;
    }

    return text;
  }

  protected async createReplyMessage(
    ctx: GameSelectionSceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: IGameDataMarkup,
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
    ctx: GameSelectionSceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: IGameDataMarkup,
  ) {
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
    ctx: GameSelectionSceneContext,
    markup: InlineKeyboardMarkup,
  ): Promise<Message> {
    return this.viewReplyBuilder.createViewReplyMessage(
      ctx,
      ViewCode.EMPTY_CATEGORY_VIEW,
      {
        parse_mode: 'HTML',
        reply_markup: markup,
      },
    );
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    return [[Markup.button.callback('Вернуться', 'return')]];
  }

  @Action('return')
  async returnToCategorySelection(@Ctx() ctx: BotSceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }

  @On('message')
  async searchGame(@Ctx() ctx: GameSelectionSceneContext) {
    const categoryId = ctx.scene.state.categoryId;
    await ctx.scene.enter<SearchGameSceneState>(SEARCH_GAME_SCENE_ID, {
      query: (ctx.message as any).text,
      categoryId,
      prevScene: {
        id: GAME_SELECTION_SCENE_ID,
        state: { ...ctx.scene.session.state },
      },
    });
  }
}
