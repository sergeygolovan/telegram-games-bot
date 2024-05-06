import { Category, Game } from '@prisma/client';
import { IDataMarkup } from '../core';
import internal from 'stream';

export interface ICategoryDataMarkup extends IDataMarkup {
  text: string;
  image: internal.Readable | null;
}

export type CategoryWithGames = Category & {
  games: Game[];
};
