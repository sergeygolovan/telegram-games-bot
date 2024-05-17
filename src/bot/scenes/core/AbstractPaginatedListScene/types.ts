import internal from 'stream';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export interface IDataMarkup {
  buttons: InlineKeyboardButton[][];
}

export interface IMessageContent {
  text: string;
  image: internal.Readable | null;
}

export interface PaginationSceneState {
  pageNumber?: number;
  pageCount?: number;
  totalCount?: number;
  replyMessageId?: number;
}
