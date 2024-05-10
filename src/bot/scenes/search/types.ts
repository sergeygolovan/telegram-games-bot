import { Category, Game } from '@prisma/client';
import { IDataMarkup, IMessageContent } from '../core';
import { BotSceneContext } from 'src/bot/types';

export type GameWithCategory = Game & {
  category: Category;
};

export interface ISearchGameDataMarkup extends IDataMarkup, IMessageContent {}

export type SearchGameSceneState = {
  query?: string;
  categoryId?: number;
  prevScene?: {
    id: string;
    state: any;
  };
};

export type SearchGameSceneContext = BotSceneContext<SearchGameSceneState>;
