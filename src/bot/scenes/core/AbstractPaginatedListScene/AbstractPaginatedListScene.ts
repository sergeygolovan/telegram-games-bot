import { Action, Ctx, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { IDataMarkup } from './types';
import { BotSceneContext } from 'src/bot/types';
import { Logger } from '@nestjs/common';

/**
 * Базовый класс сцены для отрисовки inline-меню с возможностью пагинации
 */
export abstract class AbstractPaginatedListScene<T, S extends object = any> {
  protected totalCount = 0;
  protected pageNumber = 1;
  protected pageCount = 1;
  protected data: T[] = [];
  protected paginatedData: T[];
  protected replyMessage: Message = null;
  protected logger = new Logger(AbstractPaginatedListScene.name);

  constructor(
    protected readonly sceneId,
    protected pageSize = 10,
  ) {}

  /**
   * Обработчик входа в сцену
   * @param ctx
   */
  @SceneEnter()
  protected async enter(@Ctx() ctx: BotSceneContext<S>) {
    this.logger.debug(
      `[${ctx.from.username}] enter scene with state ${JSON.stringify(ctx.scene.state)}`,
    );
    this.data = await this.getDataset(ctx);

    await this.initialize(ctx);
  }

  /**
   * Метод начальной инициализации сцены
   * @param ctx
   */
  protected async initialize(ctx: BotSceneContext<S>) {
    this.logger.debug(`[${ctx.from.username}] initialize scene`);
    this.totalCount = this.data.length;
    this.pageNumber = 1;
    this.pageCount = Math.ceil(this.totalCount / this.pageSize);
    this.paginatedData = this.data.slice(0, this.pageSize);
    this.replyMessage = null;

    await this.render(ctx);
  }

  /**
   * Обработчик выхода из сцены
   * @param ctx
   */
  @SceneLeave()
  protected async leave(@Ctx() ctx: BotSceneContext<S>) {
    if (this.replyMessage) {
      try {
        await ctx.deleteMessage(this.replyMessage.message_id);
      } catch (e) {
        console.error(e);
      }
      this.replyMessage = null;
    }
  }

  /**
   * Обработчик переключения на предыдущую страницу
   * @param ctx
   */
  @Action('prev')
  protected async prev(@Ctx() ctx: BotSceneContext<S>) {
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
  protected async next(@Ctx() ctx: BotSceneContext<S>) {
    if (this.totalCount - this.pageNumber * this.pageSize > 0) {
      this.pageNumber += 1;
      await this.onPageNumberChanged(ctx);
    }
  }

  /**
   * Обработчик изменения номера страницы
   * @param ctx
   */
  protected async onPageNumberChanged(ctx: BotSceneContext<S>) {
    this.paginatedData = this.data.slice(
      (this.pageNumber - 1) * this.pageSize,
      this.pageNumber * this.pageSize,
    );
    await this.render(ctx);
  }

  /**
   * Метод для получения разметки навигационных кнопок для пагинации
   * @param ctx
   * @returns InlineKeyboardButton[][]
   */
  protected async getNavButtonsMarkup(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: BotSceneContext<S>,
  ): Promise<InlineKeyboardButton[][]> {
    const buttons = [];

    if (this.pageNumber > 1) {
      buttons.push(Markup.button.callback('⬅️ Назад', 'prev'));
    }
    if (this.totalCount - this.pageNumber * this.pageSize > 0) {
      buttons.push(Markup.button.callback('Вперед ➡️', 'next'));
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
  protected async render(ctx: BotSceneContext<S>) {
    this.logger.debug(`[${ctx.from.username}] render scene`);
    const dataMarkup = await this.getDataMarkup(ctx, this.paginatedData);
    const navButtonsMarkup = await this.getNavButtonsMarkup(ctx);
    let extraButtonsMarkup: InlineKeyboardButton[][] = [];

    if (this.getExtraButtonsMarkup) {
      extraButtonsMarkup = await this.getExtraButtonsMarkup(ctx);
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
  protected abstract getDataMarkup(
    ctx: BotSceneContext<S>,
    data: T[],
  ): Promise<IDataMarkup>;

  /**
   * Метод получения данных для формирования списка
   * @param ctx
   */
  protected abstract getDataset(ctx: BotSceneContext<S>): Promise<T[]>;

  /**
   * Опциональный метод получения разметки дополнительных элементов списка
   */
  protected abstract getExtraButtonsMarkup?(
    ctx: BotSceneContext<S>,
  ): Promise<InlineKeyboardButton[][]>;

  /**
   * Метод для отправки пользователю сообщения со списком
   * @param ctx
   * @param markup
   * @param dataMarkup
   */
  protected abstract createReplyMessage(
    ctx: BotSceneContext<S>,
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
    ctx: BotSceneContext<S>,
    markup: InlineKeyboardMarkup,
    dataMarkup: IDataMarkup,
  ): Promise<void>;
}
