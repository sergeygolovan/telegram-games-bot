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
import { injectUserVariables } from 'src/bot/utils/injectUserVariables';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { ViewCode } from 'src/types';
import { ViewReplyBuilder } from 'src/bot/classes/ViewReplyBuilder';
import { FileStorageService } from 'src/file-storage/file-storage.service';

@Scene(GAME_SELECTION_SCENE_ID)
@Injectable()
export class GameSelectionScene extends AbstractPaginatedListScene<Game> {
  private categoryId: number;
  private viewReplyBuilder: ViewReplyBuilder;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileStorageService: FileStorageService,
  ) {
    super(8);
    this.viewReplyBuilder = new ViewReplyBuilder(fileStorageService);
  }

  protected async getDataMarkup(data: Game[]): Promise<IGameDataMarkup> {
    const properties = await this.databaseService.getViewProperties(
      ViewCode.DEFAULT_CATEGORY_VIEW,
    );

    const category = await this.databaseService.category.findUnique({
      where: { id: this.categoryId },
    });

    const text = this.getDataMarkupText(
      category.description || properties.description,
    );
    const image = await this.getDataMarkupImage(
      category.image || properties.image,
    );

    const buttons = data.map((game) => [
      {
        text: game.name,
        url: game.url,
      },
    ]);

    return {
      text,
      image,
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

  private async getDataMarkupImage(image: string) {
    if (image) {
      return this.fileStorageService.getObject(image);
    }
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
    dataMarkup: IGameDataMarkup,
  ) {
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
      ViewCode.EMPTY_CATEGORY_VIEW,
    );
    return this.viewReplyBuilder.createViewReplyMessage(ctx, properties, {
      parse_mode: 'HTML',
      reply_markup: markup,
    });
  }

  protected async getExtraButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    return [[Markup.button.callback('Вернуться', 'return')]];
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

  @Action('return')
  async returnToCategorySelection(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(CATEGORY_SELECTION_SCENE_ID);
  }
}
