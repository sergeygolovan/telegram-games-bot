import { Category, Game } from '@prisma/client';
import {
  IDataMarkup,
  IMessageContent,
} from '../core/AbstractPaginatedListScene';
import { BotSceneContext } from 'src/bot/types';
import {
  HierarchyTreeNode,
  HierarchyTreeSceneState,
} from '../core/AbstractHierarchyTreeScene/types';

export interface ICategoryDataMarkup extends IDataMarkup, IMessageContent {}

export type CategoryWithGames = Category & {
  games: Game[];
};

export type CategoryHierWithGames = CategoryWithGames & {
  children: Category[];
};

export type CategorySelectionSceneHierNode = HierarchyTreeNode<
  CategoryWithGames,
  Game
>;

export type CategorySelectionSceneState = HierarchyTreeSceneState;

export type CategorySelectionSceneContext =
  BotSceneContext<CategorySelectionSceneState>;
