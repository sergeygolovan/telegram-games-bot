import { Action, Ctx, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { SceneContext } from 'telegraf/typings/scenes';
import { IDataMarkup } from './types';

/**
 * Базовый класс сцены для отрисовки inline-меню с возможностью пагинации
 */
export abstract class AbstractPaginatedListScene<T> {
  protected totalCount = 0;
  protected pageNumber = 1;
  protected pageCount = 1;
  protected data: T[] = [];
  protected paginatedData: T[];
  protected replyMessage: Message = null;

  constructor(protected pageSize = 10) {}

  /**
   * Метод начальной инициализации сцены
   * @param ctx
   */
  protected async initialize(ctx: SceneContext) {
    this.totalCount = this.data.length;
    this.pageNumber = 1;
    this.pageCount = Math.ceil(this.totalCount / this.pageSize);
    this.paginatedData = this.data.slice(0, this.pageSize);
    this.replyMessage = null;

    await this.render(ctx);
  }

  /**
   * Обработчик входа в сцену
   * @param ctx
   */
  @SceneEnter()
  protected async enter(@Ctx() ctx: SceneContext) {
    this.data = await this.getDataset(ctx);

    await this.initialize(ctx);
  }

  /**
   * Обработчик выхода из сцены
   * @param ctx
   */
  @SceneLeave()
  protected async leave(@Ctx() ctx: SceneContext) {
    if (this.replyMessage) {
      await ctx.deleteMessage(this.replyMessage.message_id);
      this.replyMessage = null;
    }
  }

  /**
   * Обработчик переключения на предыдущую страницу
   * @param ctx
   */
  @Action('prev')
  protected async prev(@Ctx() ctx: SceneContext) {
    if (this.pageNumber > 1) {
      this.pageNumber -= 1;
      await this.onPageNumberChanged(ctx);
    }
  }

  /**
   * Обработчик переключения на следующую страницу
   * @param ctx
   */
  @Action('next')
  protected async next(@Ctx() ctx: SceneContext) {
    if (this.totalCount - this.pageNumber * this.pageSize > 0) {
      this.pageNumber += 1;
      await this.onPageNumberChanged(ctx);
    }
  }

  /**
   * Обработчик изменения номера страницы
   * @param ctx
   */
  protected async onPageNumberChanged(ctx: SceneContext) {
    this.paginatedData = this.data.slice(
      (this.pageNumber - 1) * this.pageSize,
      this.pageNumber * this.pageSize,
    );
    await this.render(ctx);
  }

  /**
   * Метод для получения разметки навигационных кнопок для пагинации
   * @returns
   */
  protected async getNavButtonsMarkup(): Promise<InlineKeyboardButton[][]> {
    const buttons = [];

    if (this.pageNumber > 1) {
      buttons.push(Markup.button.callback('Назад', 'prev'));
    }
    if (this.totalCount - this.pageNumber * this.pageSize > 0) {
      buttons.push(Markup.button.callback('Вперед', 'next'));
    }

    if (buttons.length) {
      return [buttons];
    }

    return [];
  }

  /**
   * Метод отрисовки списка
   * @param ctx
   */
  protected async render(ctx: SceneContext) {
    const dataMarkup = await this.getDataMarkup(this.paginatedData);
    const navButtonsMarkup = await this.getNavButtonsMarkup();
    let extraButtonsMarkup: InlineKeyboardButton[][] = [];

    if (this.getExtraButtonsMarkup) {
      extraButtonsMarkup = await this.getExtraButtonsMarkup();
    }

    const replyMarkup: InlineKeyboardMarkup = {
      inline_keyboard: dataMarkup.buttons.concat(
        navButtonsMarkup,
        extraButtonsMarkup,
      ),
    };

    if (this.replyMessage === null) {
      this.replyMessage = await this.createReplyMessage(
        ctx,
        replyMarkup,
        dataMarkup,
      );
    } else {
      await this.editReplyMessage(ctx, replyMarkup, dataMarkup);
    }
  }

  /**
   * Метод получения разметки элементов списка
   * @param data
   */
  protected abstract getDataMarkup(data: T[]): Promise<IDataMarkup>;

  /**
   * Метод получения данных для формирования списка
   * @param ctx
   */
  protected abstract getDataset(ctx: SceneContext): Promise<T[]>;

  /**
   * Опциональный метод получения разметки дополнительных элементов списка
   */
  protected abstract getExtraButtonsMarkup?(): Promise<
    InlineKeyboardButton[][]
  >;

  /**
   * Метод для отправки пользователю сообщения со списком
   * @param ctx
   * @param markup
   * @param dataMarkup
   */
  protected abstract createReplyMessage(
    ctx: SceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: IDataMarkup,
  ): Promise<Message>;

  /**
   * Метод для обновления ранее отправленого пользователю сообщения со списком
   * @param ctx
   * @param markup
   * @param dataMarkup
   */
  protected abstract editReplyMessage(
    ctx: SceneContext,
    markup: InlineKeyboardMarkup,
    dataMarkup: IDataMarkup,
  ): Promise<void>;
}
