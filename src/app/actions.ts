'use server';

import { supabase } from '@/lib/supabase';
import { Album, Scope, MasteringStatus } from '@/types';

/**
 * Fetches all albums from the Supabase database.
 * Sorted by created_at descending so newly added albums appear first.
 */
export async function getAlbums(): Promise<{ success: boolean; data: Album[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching albums from Supabase:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as Album[]) || [] };
  } catch (err: any) {
    console.error('Unexpected error fetching albums:', err);
    return { success: false, data: [], error: err.message || 'An unexpected error occurred.' };
  }
}

interface NewAlbumInput {
  artist: string;
  album_title: string;
  year?: string;
  scope: Scope;
  mastering_status: MasteringStatus;
}

/**
 * Adds a new album to the Supabase database.
 */
export async function addAlbum(input: NewAlbumInput): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    // Basic validation
    if (!input.artist.trim()) {
      return { success: false, error: 'Artist name is required.' };
    }
    if (!input.album_title.trim()) {
      return { success: false, error: 'Album title is required.' };
    }

    const { data, error } = await supabase
      .from('albums')
      .insert([
        {
          artist: input.artist.trim(),
          album_title: input.album_title.trim(),
          year: input.year?.trim() || '',
          scope: input.scope,
          mastering_status: input.mastering_status,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting album to Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Album };
  } catch (err: any) {
    console.error('Unexpected error adding album:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
