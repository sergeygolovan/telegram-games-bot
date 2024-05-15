import { BotSceneContext, StateWithPreviousSceneState } from 'src/bot/types';

export type DonationsSceneState = StateWithPreviousSceneState;

export type SearchGameSceneContext = BotSceneContext<DonationsSceneState>;
