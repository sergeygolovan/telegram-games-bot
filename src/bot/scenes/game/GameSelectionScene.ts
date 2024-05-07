import { Injectable } from '@nestjs/common';
import { Game } from '@prisma/client';
import { Action, Ctx, Scene } from 'nestjs-telegraf';
import { DatabaseService } from 'src/database/database.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { CATEGORY_SELECTION_SCENE_ID } from '../categories';
import { AbstractPaginatedListScene } from '../core';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { GAME_SELECTION_SCENE_ID } from './constants';
import { IGameDataMarkup } from './types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { ViewCode } from 'src/types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Injectable()
@Scene(GAME_SELECTION_SCENE_ID)
export class GameSelectionScene extends AbstractPaginatedListScene<Game> {
  private categoryId: number;
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

  protected async getDataset(ctx: SceneContext): Promise<Game[]> {
    this.categoryId = Number(ctx.scene.session.state['categoryId']);

    return this.databaseService.game.findMany({
      where: {
        categoryId: this.categoryId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  protected async getDataMarkup(
    ctx: SceneContext,
    data: Game[],
  ): Promise<IGameDataMarkup> {
    const { description, image } =
      await this.databaseService.category.findUniqueOrThrow({
        where: { id: this.categoryId },
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
    ctx: SceneContext,
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
    ctx: SceneContext,
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
    ctx: SceneContext,
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
  async returnToCategorySelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }
}
