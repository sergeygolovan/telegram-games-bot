import { Category, Game } from '@prisma/client';
import { IDataMarkup, IMessageContent, PaginationSceneState } from '../core';
import { BotSceneContext, StateWithPreviousSceneState } from 'src/bot/types';

export type GameWithCategory = Game & {
  category: Category;
};

export interface ISearchGameDataMarkup extends IDataMarkup, IMessageContent {}

export type SearchGameSceneState = {
  query?: string;
  categoryId?: number;
} & PaginationSceneState &
  StateWithPreviousSceneState;

export type SearchGameSceneContext = BotSceneContext<SearchGameSceneState>;
