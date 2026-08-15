import { createFeatureSelector, createSelector } from '@ngrx/store';

import { playerTeamsFeatureKey, type PlayerTeamsState } from './player-teams.reducer';

export const selectPlayerTeamsState = createFeatureSelector<PlayerTeamsState>(playerTeamsFeatureKey);

export const selectMyTeamView = createSelector(selectPlayerTeamsState, (state) => state.view);
