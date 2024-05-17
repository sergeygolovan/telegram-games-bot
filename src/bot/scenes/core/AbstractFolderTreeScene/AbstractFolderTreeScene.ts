import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { AbstractPaginatedListScene } from '../AbstractPaginatedListScene';
import { BotSceneContext } from 'src/bot/types';
import {
  HierDatasetStructure,
  FolderTreeLeafNode,
  FolderTreeNode,
  FolderTreeParentNode,
  FolderTreeSceneState,
  ObjectWithId,
  ObjectWithReplyData,
} from './types';
import { Markup } from 'telegraf';
import { Action, Ctx } from 'nestjs-telegraf';

/**
 * Абстрактный класс сцены для отрисовки иерархического списка в inline-меню с возможностью пагинации
 */
export abstract class AbstractFolderTreeScene<
  D extends ObjectWithReplyData = any,
  P extends ObjectWithId = any,
  L extends ObjectWithId = any,
  S extends FolderTreeSceneState = FolderTreeSceneState,
> extends AbstractPaginatedListScene<FolderTreeNode<P, L>, S> {
  constructor(protected pageSize: number = 10) {
    super(pageSize);
  }

  protected async fetchDataset(
    ctx: BotSceneContext<S>,
  ): Promise<FolderTreeNode<P, L>[]> {
    const currentNodeId = ctx.scene.state.nodeId ?? null;

    this.logger.debug(
      `[${ctx.from.username}] get scene dataset (nodeId = ${currentNodeId})`,
    );

    const structure = await this.getDatasetStructure(ctx);
    const parentNodes: FolderTreeParentNode<P>[] = structure.parents.map(
      (parent) => ({
        type: 'parent',
        id: parent.id,
        parentId: currentNodeId,
        data: parent,
      }),
    );
    const leafNodes: FolderTreeLeafNode<L>[] = structure.leafs.map((leaf) => ({
      type: 'leaf',
      id: leaf.id,
      parentId: currentNodeId,
      data: leaf,
    }));

    return [...parentNodes, ...leafNodes];
  }

  private async getDatasetStructure(ctx: BotSceneContext<S>) {
    const currentNodeData = await this.fetchCurrentNodeData(
      ctx,
      ctx.scene.state.nodeId ?? null,
    );
    if (currentNodeData) {
      return this.getNodeDatasetStructure(ctx, currentNodeData);
    }
    return this.getRootDatasetStructure(ctx);
  }

  protected getDataMarkupButtons(
    ctx: BotSceneContext<S>,
    data: FolderTreeNode<P, L>[],
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

  protected async render(
    ctx: BotSceneContext<S>,
    data: FolderTreeNode<P, L>[],
  ) {
    const currentNodeData = await this.fetchCurrentNodeData(
      ctx,
      ctx.scene.state.nodeId ?? null,
    );
    return super.render(ctx, data, {
      currentNodeData,
    });
  }

  @Action('up')
  protected async up(@Ctx() ctx: BotSceneContext<S>) {
    this.logger.debug(`[${ctx.from.username}] move up on te hier structure`);
    ctx.scene.state.parentNodeId = null;
    ctx.scene.state.nodeId = ctx.scene.state.parentNodeId;
    await ctx.scene.reenter();
  }

  @Action(/[\d]+/)
  protected async down(@Ctx() ctx: BotSceneContext<S>) {
    const nodeId = Number((ctx as any).match[0]);
    this.logger.debug(`[${ctx.from.username}] select node with id = ${nodeId}`);
    ctx.scene.state.parentNodeId = ctx.scene.state.nodeId;
    ctx.scene.state.nodeId = nodeId;
    await ctx.scene.reenter();
  }

  protected abstract fetchCurrentNodeData(
    ctx: BotSceneContext<S>,
    nodeId: number | null,
  ): Promise<D>;

  protected abstract getRootDatasetStructure(
    ctx: BotSceneContext<S>,
  ): Promise<HierDatasetStructure>;

  protected abstract getNodeDatasetStructure(
    ctx: BotSceneContext<S>,
    node: D,
  ): Promise<HierDatasetStructure>;

  protected abstract getParentNodeButtonMarkup(node: P): InlineKeyboardButton;
  protected abstract getLeafNodeButtonMarkup(node: L): InlineKeyboardButton;
}
