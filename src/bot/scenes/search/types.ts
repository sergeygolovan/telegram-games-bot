import { Category, Game } from '@prisma/client';
import { IDataMarkup, IMessageContent } from '../core';

export type GameWithCategory = Game & {
  category: Category;
};

export interface ISearchGameDataMarkup extends IDataMarkup, IMessageContent {}
