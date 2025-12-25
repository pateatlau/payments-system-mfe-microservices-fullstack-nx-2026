/**
 * Profile Service - Business Logic
 *
 * POC-3 Phase 5.2: Redis Caching Integration
 * - Cache profile lookups
 * - Cache user preferences
 * - Invalidate cache on profile updates
 * - 5 minute TTL for profile data
 */

import { prisma } from '../lib/prisma';
import logger from '../utils/logger';
import { cache, CacheKeys, CacheTags, ProfileCacheTTL } from '../lib/cache';

export interface UpdateProfileData {
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdatePreferencesData {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  timezone?: string;
}

export const profileService = {
  /**
   * Get or create user profile
   */
  async getOrCreateProfile(userId: string) {
    logger.debug('Getting profile for user', { userId });

    // Try cache first
    const cacheKey = CacheKeys.profile(userId);
    const cached = await cache.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    // Try to find existing profile
    // Note: Profile Service doesn't have a User table (no relation)
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Create profile if it doesn't exist
    if (!profile) {
      logger.info('Profile not found, creating new profile', { userId });
      profile = await prisma.userProfile.create({
        data: {
          userId,
          phone: null,
          address: null,
          avatarUrl: null,
          bio: null,
          preferences: {},
        },
      });
    }

    // Cache the profile
    await cache.set(cacheKey, profile, {
      ttl: ProfileCacheTTL.PROFILE,
      tags: [CacheTags.profiles, CacheTags.user(userId)],
    });

    return profile;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData) {
    logger.debug('Updating profile', { userId, data });

    // Ensure profile exists first
    await this.getOrCreateProfile(userId);

    // Update profile
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        phone: data.phoneNumber,
        address: data.address,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        updatedAt: new Date(),
      },
    });

    // Invalidate profile cache
    await cache.invalidateByTag(CacheTags.user(userId));

    logger.info('Profile updated', { userId });

    return profile;
  },

  /**
   * Get user preferences
   */
  async getPreferences(userId: string) {
    logger.debug('Getting preferences for user', { userId });

    // Try cache first
    const cacheKey = CacheKeys.profilePreferences(userId);
    const cached = await cache.get<Record<string, unknown>>(cacheKey);

    if (cached) {
      return cached;
    }

    // Ensure profile exists
    const profile = await this.getOrCreateProfile(userId);

    // Return preferences from JSON field
    const preferences =
      profile && profile.preferences
        ? (profile.preferences as Record<string, unknown>)
        : {};

    // Cache the preferences
    await cache.set(cacheKey, preferences, {
      ttl: ProfileCacheTTL.PREFERENCES,
      tags: [CacheTags.profiles, CacheTags.user(userId)],
    });

    return preferences;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, data: UpdatePreferencesData) {
    logger.debug('Updating preferences', { userId, data });

    // Ensure profile exists
    const existingProfile = await this.getOrCreateProfile(userId);

    // Get existing preferences or empty object
    const existingPrefs = existingProfile?.preferences
      ? (existingProfile.preferences as Record<string, unknown>)
      : {};

    // Merge new preferences with existing ones
    const updatedPrefs = { ...existingPrefs, ...data };

    // Update profile with new preferences
    await prisma.userProfile.update({
      where: { userId },
      data: {
        preferences: updatedPrefs,
      },
    });

    // Invalidate profile and preferences cache
    await cache.invalidateByTag(CacheTags.user(userId));

    logger.info('Preferences updated', { userId });

    // Return updated preferences
    return updatedPrefs;
  },
};
