import { Category, Game } from '@prisma/client';
import { IDataMarkup, IMessageContent } from '../core';

export interface ICategoryDataMarkup extends IDataMarkup, IMessageContent {}

export type CategoryWithGames = Category & {
  games: Game[];
};
