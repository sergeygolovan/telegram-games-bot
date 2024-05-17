import { Category, Game } from '@prisma/client';
import {
  IDataMarkup,
  IMessageContent,
} from '../core/AbstractPaginatedListScene';
import { BotSceneContext } from 'src/bot/types';
import {
  FolderTreeNode,
  FolderTreeSceneState,
} from '../core/AbstractFolderTreeScene/types';

export interface ICategoryDataMarkup extends IDataMarkup, IMessageContent {}

export type CategoryWithGames = Category & {
  games: Game[];
};

export type CategoryHierWithGames = CategoryWithGames & {
  children: Category[];
};

export type CategorySelectionSceneHierNode = FolderTreeNode<
  CategoryWithGames,
  Game
>;

export type CategorySelectionSceneRenderOptions = {
  currentNodeData: CategoryHierWithGames | null;
};

export type CategorySelectionSceneState = FolderTreeSceneState;

export type CategorySelectionSceneContext =
  BotSceneContext<CategorySelectionSceneState>;
