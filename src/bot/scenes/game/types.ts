import internal from 'stream';
import { IDataMarkup } from '../core/types';

export interface IGameDataMarkup extends IDataMarkup {
  text: string;
  image: internal.Readable | null;
}
