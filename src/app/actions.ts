'use server';

import { supabase } from '@/lib/supabase';
import { Album, Scope } from '@/types';

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
  digital: boolean;
  cd: boolean;
  vinyl: boolean;
  notes?: string;
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
          digital: input.digital,
          cd: input.cd,
          vinyl: input.vinyl,
          notes: input.notes?.trim() || '',
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

/**
 * Updates an existing album in the Supabase database.
 */
export async function updateAlbum(
  id: string,
  input: Partial<NewAlbumInput>
): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    // Basic validation if fields are provided
    if (input.artist !== undefined && !input.artist.trim()) {
      return { success: false, error: 'Artist name is required.' };
    }
    if (input.album_title !== undefined && !input.album_title.trim()) {
      return { success: false, error: 'Album title is required.' };
    }

    const updateData: any = {};
    if (input.artist !== undefined) updateData.artist = input.artist.trim();
    if (input.album_title !== undefined) updateData.album_title = input.album_title.trim();
    if (input.year !== undefined) updateData.year = input.year.trim();
    if (input.scope !== undefined) updateData.scope = input.scope;
    if (input.digital !== undefined) updateData.digital = input.digital;
    if (input.cd !== undefined) updateData.cd = input.cd;
    if (input.vinyl !== undefined) updateData.vinyl = input.vinyl;
    if (input.notes !== undefined) updateData.notes = input.notes.trim();

    const { data, error } = await supabase
      .from('albums')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating album in Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Album };
  } catch (err: any) {
    console.error('Unexpected error updating album:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
