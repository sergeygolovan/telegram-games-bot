import { Action, Ctx, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from 'telegraf/typings/core/types/typegram';
import { IDataMarkup, PaginationSceneState } from './types';
import { BotSceneContext } from 'src/bot/types';
import { Logger } from '@nestjs/common';

/**
 * Базовый класс сцены для отрисовки inline-меню с возможностью пагинации
 */
export abstract class AbstractPaginatedListScene<
  T,
  S extends PaginationSceneState = PaginationSceneState,
  P extends object = object,
> {
  protected readonly logger = new Logger(AbstractPaginatedListScene.name);

  constructor(protected pageSize = 10) {}

  /**
   * Обработчик входа в сцену
   * @param ctx
   */
  @SceneEnter()
  protected async enter(@Ctx() ctx: BotSceneContext<S>) {
    this.logger.debug(
      `[${ctx.from.username}] enter scene with state ${JSON.stringify(ctx.scene.state)}`,
    );
    await this.initialize(ctx);
  }

  /**
   * Метод начальной инициализации сцены
   * @param ctx
   */
  protected async initialize(ctx: BotSceneContext<S>) {
    this.logger.debug(`[${ctx.from.username}] initialize scene`);

    const data = await this.fetchDataset(ctx);
    ctx.scene.state.totalCount = data.length;
    ctx.scene.state.pageNumber = 1;
    ctx.scene.state.pageCount = Math.ceil(data.length / this.pageSize);
    ctx.scene.state.replyMessageId = null;

    await this.render(ctx, this.getPaginatedData(ctx, data));
  }

  /**
   * Обработчик выхода из сцены
   * @param ctx
   */
  @SceneLeave()
  protected async leave(@Ctx() ctx: BotSceneContext<S>) {
    if (ctx.scene.state.replyMessageId) {
      try {
        await ctx.deleteMessage(ctx.scene.state.replyMessageId);
      } catch (e) {
        console.error(e);
      }
      ctx.scene.state.replyMessageId = null;
    }
  }

  /**
   * Обработчик переключения на предыдущую страницу
   * @param ctx
   */
  @Action('prev')
  protected async prev(@Ctx() ctx: BotSceneContext<S>) {
    if (ctx.scene.state.pageNumber > 1) {
      ctx.scene.state.pageNumber = Math.max(ctx.scene.state.pageNumber - 1, 0);
      await this.onPageNumberChanged(ctx);
    }
  }

  /**
   * Обработчик переключения на следующую страницу
   * @param ctx
   */
  @Action('next')
  protected async next(@Ctx() ctx: BotSceneContext<S>) {
    if (
      ctx.scene.state.totalCount - ctx.scene.state.pageNumber * this.pageSize >
      0
    ) {
      ctx.scene.state.pageNumber = Math.min(
        ctx.scene.state.pageNumber + 1,
        ctx.scene.state.pageCount,
      );
      await this.onPageNumberChanged(ctx);
    }
  }

  protected getPaginatedData(ctx: BotSceneContext<S>, data: T[]) {
    return data.slice(
      (ctx.scene.state.pageNumber - 1) * this.pageSize,
      ctx.scene.state.pageNumber * this.pageSize,
    );
  }

  /**
   * Обработчик изменения номера страницы
   * @param ctx
   */
  protected async onPageNumberChanged(ctx: BotSceneContext<S>) {
    const data = await this.fetchDataset(ctx);
    await this.render(ctx, this.getPaginatedData(ctx, data));
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

    if (ctx.scene.state.pageNumber > 1) {
      buttons.push(Markup.button.callback('⬅️ Назад', 'prev'));
    }
    if (
      ctx.scene.state.totalCount - ctx.scene.state.pageNumber * this.pageSize >
      0
    ) {
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
  protected async render(ctx: BotSceneContext<S>, data: T[], extraOptions?: P) {
    this.logger.debug(`[${ctx.from.username}] render scene`);
    const dataMarkup = await this.getDataMarkup(ctx, data, extraOptions);
    const navButtonsMarkup = await this.getNavButtonsMarkup(ctx);
    let extraButtonsMarkup: InlineKeyboardButton[][] = [];

    if (this.getExtraButtonsMarkup) {
      extraButtonsMarkup = await this.getExtraButtonsMarkup(ctx, extraOptions);
    }

    const replyMarkup: InlineKeyboardMarkup = {
      inline_keyboard: dataMarkup.buttons.concat(
        navButtonsMarkup,
        extraButtonsMarkup,
      ),
    };

    if (ctx.scene.state.replyMessageId === null) {
      const message = await this.createReplyMessage(
        ctx,
        replyMarkup,
        dataMarkup,
      );
      ctx.scene.state.replyMessageId = message.message_id;
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
    extraOptions?: P,
  ): Promise<IDataMarkup>;

  /**
   * Метод получения данных для формирования списка
   * @param ctx
   */
  protected abstract fetchDataset(ctx: BotSceneContext<S>): Promise<T[]>;

  /**
   * Опциональный метод получения разметки дополнительных элементов списка
   */
  protected abstract getExtraButtonsMarkup?(
    ctx: BotSceneContext<S>,
    extraOptions?: P,
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
