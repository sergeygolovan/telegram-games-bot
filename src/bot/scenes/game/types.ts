import { BotSceneContext } from 'src/bot/types';
import {
  IDataMarkup,
  IMessageContent,
} from '../core/AbstractPaginatedListScene/types';

export interface IGameDataMarkup extends IDataMarkup, IMessageContent {}

export type GameSelectionSceneState = {
  categoryId?: number;
};

export type GameSelectionSceneContext =
  BotSceneContext<GameSelectionSceneState>;
