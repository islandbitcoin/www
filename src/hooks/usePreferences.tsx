import { useState, useEffect, useCallback } from 'react';
import { getUserPreferences, setUserPreferences, UserPreferences } from '@/lib/secureStorage';

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(getUserPreferences());

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      setPreferencesState(getUserPreferences());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setUserPreferences(updates);
    setPreferencesState(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleMuteUser = useCallback((pubkey: string) => {
    const mutedUsers = preferences.mutedUsers || [];
    const updated = mutedUsers.includes(pubkey)
      ? mutedUsers.filter(u => u !== pubkey)
      : [...mutedUsers, pubkey];
    
    updatePreferences({ mutedUsers: updated });
  }, [preferences.mutedUsers, updatePreferences]);

  const toggleFavoriteUser = useCallback((pubkey: string) => {
    const favoriteUsers = preferences.favoriteUsers || [];
    const updated = favoriteUsers.includes(pubkey)
      ? favoriteUsers.filter(u => u !== pubkey)
      : [...favoriteUsers, pubkey];
    
    updatePreferences({ favoriteUsers: updated });
  }, [preferences.favoriteUsers, updatePreferences]);

  const hidePost = useCallback((eventId: string) => {
    const hiddenPosts = preferences.hiddenPosts || [];
    if (!hiddenPosts.includes(eventId)) {
      updatePreferences({ hiddenPosts: [...hiddenPosts, eventId] });
    }
  }, [preferences.hiddenPosts, updatePreferences]);

  return {
    preferences,
    updatePreferences,
    toggleMuteUser,
    toggleFavoriteUser,
    hidePost,
  };
}