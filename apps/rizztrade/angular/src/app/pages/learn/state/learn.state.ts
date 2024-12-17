import { createFeature, createReducer, on, createActionGroup, props } from '@ngrx/store';

export interface UserProgress {
  completedLessons: string[];
  currentLesson: string;
  quizScores: Record<string, number>;
}

export interface LearnState {
  userProgress: UserProgress | null;
  loading: boolean;
  error: string | null;
}

export const initialState: LearnState = {
  userProgress: null,
  loading: false,
  error: null,
};

export const LearnActions = createActionGroup({
  source: 'Learn',
  events: {
    'Load Progress': props<{ userId: string }>(),
    'Load Progress Success': props<{ progress: UserProgress }>(),
    'Load Progress Failure': props<{ error: string }>(),
    'Update Progress': props<{ progress: Partial<UserProgress> }>(),
  },
});

export const learnFeature = createFeature({
  name: 'learn',
  reducer: createReducer(
    initialState,
    on(LearnActions.loadProgress, (state) => ({
      ...state,
      loading: true,
    })),
    on(LearnActions.loadProgressSuccess, (state, { progress }) => ({
      ...state,
      loading: false,
      userProgress: progress,
    })),
    on(LearnActions.loadProgressFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(LearnActions.updateProgress, (state, { progress }) => ({
      ...state,
      userProgress: {
        ...state.userProgress,
        ...progress,
      },
    }))
  ),
});
