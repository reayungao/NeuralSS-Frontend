// src/config.ts

/**
 * The vertical distance in pixels a user must pull down before the refresh action is triggered.
 */
export const PULL_TO_REFRESH_THRESHOLD = 80;

/**
 * The delay in milliseconds after the user stops typing before the AI search is initiated.
 * This prevents excessive API calls during typing.
 */
export const SEARCH_DEBOUNCE_MS = 600;

/**
 * The maximum number of recent search queries to store and display in the search history.
 */
export const SEARCH_HISTORY_LIMIT = 8;
