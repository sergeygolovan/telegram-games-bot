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
  P extends object = any,
  L extends object = any,
  T extends HierarchyTreeNode<P, L> = HierarchyTreeNode<P, L>,
  S extends HierarchyTreeSceneState = HierarchyTreeSceneState,
> extends AbstractPaginatedListScene<T, S> {
  constructor(protected pageSize: number = 10) {
    super(pageSize);
  }

  /**
   * Обработчик входа в сцену
   * @param ctx
   */

  protected getDataMarkupButtons(
    ctx: BotSceneContext<S>,
    data: T[],
  ): InlineKeyboardButton[][] {
    return data.map((node) => {
      if (node.type === 'parent') {
        return [this.getParentNodeButtonMarkup(node.data)];
      }
      return [this.getLeafNodeButtonMarkup(node.data)];
    });
  }

  protected async getNavButtonsMarkup(
    ctx: BotSceneContext<S>,
  ): Promise<InlineKeyboardButton[][]> {
    const buttons = await super.getNavButtonsMarkup(ctx);
    const showUpButton = ctx.scene.state.nodeId ?? false;

    if (showUpButton) {
      buttons.push([Markup.button.callback('⬆️ На уровень выше', 'up')]);
    }

    return buttons;
  }

  @Action('up')
  protected async up(@Ctx() ctx: BotSceneContext<S>) {
    ctx.scene.state.nodeId = ctx.scene.state.parentNodeId;
    ctx.scene.state.parentNodeId = null;
    await ctx.scene.reenter();
  }

  protected abstract getParentNodeButtonMarkup(node: P): InlineKeyboardButton;
  protected abstract getLeafNodeButtonMarkup(node: L): InlineKeyboardButton;
}
