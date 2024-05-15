import {
  SceneContext,
  SceneContextScene,
  SceneSession,
  SceneSessionData,
} from 'telegraf/typings/scenes';
import { SessionContext } from 'telegraf/typings/session';

export enum ViewCode {
  GREETINGS_VIEW = 'GREETINGS_VIEW',
  EMPTY_CATEGORY_VIEW = 'EMPTY_CATEGORY_VIEW',
  DEFAULT_CATEGORY_VIEW = 'DEFAULT_CATEGORY_VIEW',
  EMPTY_GAME_SEARCH_RESULTS_VIEW = 'EMPTY_GAME_SEARCH_RESULTS_VIEW',
  GAME_SEARCH_RESULTS_VIEW = 'GAME_SEARCH_RESULTS_VIEW',
  FEEDBACK_VIEW_BEFORE = 'FEEDBACK_VIEW_BEFORE',
  FEEDBACK_VIEW_AFTER = 'FEEDBACK_VIEW_AFTER',
  CATEGORY_SELECTION_VIEW = 'CATEGORY_SELECTION_VIEW',
  EMPTY_CATEGORY_LIST_VIEW = 'EMPTY_CATEGORY_LIST_VIEW',
  DONATIONS_VIEW = 'DONATIONS_VIEW',
}

export interface BotSceneSessionData<S extends object = any>
  extends SceneSessionData {
  state?: S;
}
export interface BotSceneSession<
  S extends object = any,
  D extends BotSceneSessionData<S> = BotSceneSessionData<S>,
> extends SceneSession<D> {
  count?: number;
  username?: string;
  userId?: number;
  chatId?: number;
  sentMessageIds: number[];
  lastRequestDate?: Date;
  sessionsCount?: number;
  state?: S;
}

export interface BotSessionContext<
  P extends object = any,
  S extends BotSceneSession<P> = BotSceneSession<P>,
> extends SessionContext<S> {}

interface BotSceneContextScene<
  C extends BotSessionContext<S, BotSceneSession<S, D>>,
  S extends object = any,
  D extends BotSceneSessionData<S> = BotSceneSessionData<S>,
> extends SceneContextScene<C, D> {
  state: D['state'];
  enter<T extends object>(
    sceneId: string,
    initialState?: T,
    silent?: boolean,
  ): Promise<unknown>;
}

export interface BotSceneContext<
  S extends object = any,
  D extends BotSceneSessionData<S> = BotSceneSessionData<S>,
> extends SceneContext<D> {
  session: BotSceneSession<S, D>;
  scene: BotSceneContextScene<BotSceneContext<S, D>, S, D>;
}

export interface StateWithPreviousSceneState<S extends object = any> {
  prevScene?: {
    id: string;
    state: S;
  };
}
