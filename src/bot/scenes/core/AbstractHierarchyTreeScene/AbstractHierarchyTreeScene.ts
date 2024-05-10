import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { AbstractPaginatedListScene } from '../AbstractPaginatedListScene';
import { BotSceneContext } from 'src/bot/types';
import { HierarchyTreeNode, HierarchyTreeSceneState } from './types';
import { Markup } from 'telegraf';
import { Action, Ctx } from 'nestjs-telegraf';

/**
 * Абстрактный класс сцены для отрисовки иерархического списка в inline-меню с возможностью пагинации
 */
export abstract class AbstractHierarchyTreeScene<
  T extends HierarchyTreeNode = HierarchyTreeNode,
  S extends HierarchyTreeSceneState = HierarchyTreeSceneState,
> extends AbstractPaginatedListScene<T, S> {
  constructor(protected pageSize: number = 10) {
    super(pageSize);
  }

  /**
   * Обработчик входа в сцену
   * @param ctx
   */

  protected async getDataMarkupButtons(
    ctx: BotSceneContext<S>,
    data: T[],
  ): Promise<InlineKeyboardButton[][]> {
    return data.map((node) => {
      if (node.children.length > 0) {
        return [this.getParentNodeButtonMarkup(node)];
      }
      return [this.getLeafNodeButtonMarkup(node)];
    });
  }

  protected async getNavButtonsMarkup(
    ctx: BotSceneContext<S>,
  ): Promise<InlineKeyboardButton[][]> {
    const buttons = await super.getNavButtonsMarkup(ctx);
    const hasParent = ctx.scene.state.parentNodeId !== undefined;

    if (hasParent) {
      buttons.push([Markup.button.callback('⬆️ На уровень выше', 'up')]);
    }

    return buttons;
  }

  @Action('up')
  protected async up(@Ctx() ctx: BotSceneContext<S>) {
    ctx.scene.state.currentNodeId = ctx.scene.state.parentNodeId;
    ctx.scene.state.parentNodeId = undefined;
    await ctx.scene.reenter();
  }

  protected abstract getParentNodeButtonMarkup(node: T): InlineKeyboardButton;
  protected abstract getLeafNodeButtonMarkup(node: T): InlineKeyboardButton;
}
