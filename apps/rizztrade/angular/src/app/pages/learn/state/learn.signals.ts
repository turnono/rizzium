import { computed } from '@angular/core';
import { signalStore, withComputed, withState, withMethods } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';

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

const initialState: LearnState = {
  userProgress: null,
  loading: false,
  error: null,
};

export const LearnStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ userProgress }) => ({
    hasProgress: computed(() => !!userProgress()),
    completedLessonsCount: computed(() => userProgress()?.completedLessons.length ?? 0),
  })),
  withMethods(({ userProgress, ...store }) => ({
    updateProgress(progress: Partial<UserProgress>) {
      patchState(store, {
        userProgress: {
          ...userProgress(),
          ...progress,
        },
      });
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
  }))
);
