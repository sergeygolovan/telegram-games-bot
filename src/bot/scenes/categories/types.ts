import { Category, Game } from '@prisma/client';
import {
  IDataMarkup,
  IMessageContent,
} from '../core/AbstractPaginatedListScene';
import { BotSceneContext } from 'src/bot/types';

export interface ICategoryDataMarkup extends IDataMarkup, IMessageContent {}

export type CategoryWithGames = Category & {
  games: Game[];
};

export type CategorySelectionSceneState = any;

export type CategorySelectionSceneContext =
  BotSceneContext<CategorySelectionSceneState>;
