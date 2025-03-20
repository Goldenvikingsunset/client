import { SavedFilter } from '../types';

// We'll store filters in localStorage for now
const STORAGE_KEY = 'rtm_saved_filters';

export const getSavedFilters = (): SavedFilter[] => {
  const filters = localStorage.getItem(STORAGE_KEY);
  return filters ? JSON.parse(filters) : [];
};

export const saveFilter = (filter: SavedFilter): void => {
  const filters = getSavedFilters();
  filters.push(filter);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
};

export const deleteFilter = (id: string): void => {
  const filters = getSavedFilters();
  const updatedFilters = filters.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
};