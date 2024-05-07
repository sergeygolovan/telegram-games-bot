import internal from 'stream';
import { IDataMarkup } from '../core';

export interface ISearchGameDataMarkup extends IDataMarkup {
  text: string;
  image: internal.Readable | null;
}
