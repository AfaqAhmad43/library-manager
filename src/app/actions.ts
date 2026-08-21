'use server';

import { supabase } from '@/lib/supabase';
import { Album, Scope } from '@/types';

// ─────────────────────────────────────────────
//  GET ALL ALBUMS
// ─────────────────────────────────────────────
export async function getAlbums(): Promise<{
  success: boolean;
  data: Album[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching albums:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as Album[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Unexpected error.' };
  }
}

// ─────────────────────────────────────────────
//  ADD ALBUM
// ─────────────────────────────────────────────
interface AlbumInput {
  artist: string;
  album_title: string;
  year?: string;
  scope: Scope;
  digital: boolean;
  cd: boolean;
  vinyl: boolean;
  notes?: string;
  cover_url?: string;
}

export async function addAlbum(
  input: AlbumInput
): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    if (!input.artist.trim())       return { success: false, error: 'Artist name is required.' };
    if (!input.album_title.trim())  return { success: false, error: 'Album title is required.' };

    const { data, error } = await supabase
      .from('albums')
      .insert([{
        artist:       input.artist.trim(),
        album_title:  input.album_title.trim(),
        year:         input.year?.trim() || '',
        scope:        input.scope,
        digital:      input.digital,
        cd:           input.cd,
        vinyl:        input.vinyl,
        notes:        input.notes?.trim() || '',
        cover_url:    input.cover_url?.trim() || '',
      }])
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Album };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error.' };
  }
}

// ─────────────────────────────────────────────
//  UPDATE ALBUM
// ─────────────────────────────────────────────
export async function updateAlbum(
  id: string,
  input: Partial<AlbumInput>
): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    if (input.artist !== undefined && !input.artist.trim())
      return { success: false, error: 'Artist name is required.' };
    if (input.album_title !== undefined && !input.album_title.trim())
      return { success: false, error: 'Album title is required.' };

    const patch: Record<string, any> = {};
    if (input.artist      !== undefined) patch.artist      = input.artist.trim();
    if (input.album_title !== undefined) patch.album_title = input.album_title.trim();
    if (input.year        !== undefined) patch.year        = input.year.trim();
    if (input.scope       !== undefined) patch.scope       = input.scope;
    if (input.digital     !== undefined) patch.digital     = input.digital;
    if (input.cd          !== undefined) patch.cd          = input.cd;
    if (input.vinyl       !== undefined) patch.vinyl       = input.vinyl;
    if (input.notes       !== undefined) patch.notes       = input.notes.trim();
    if (input.cover_url   !== undefined) patch.cover_url   = input.cover_url.trim();

    const { data, error } = await supabase
      .from('albums')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Album };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error.' };
  }
}

// ─────────────────────────────────────────────
//  CACHE COVER URL (background write)
// ─────────────────────────────────────────────
/**
 * Called automatically by AlbumCard after a successful API artwork fetch.
 * Silently writes the resolved URL to cover_url so it's never re-fetched.
 */
export async function saveCoverUrl(
  id: string,
  cover_url: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('albums')
      .update({ cover_url })
      .eq('id', id);

    if (error) console.error('Failed to cache cover_url:', error.message);
  } catch (err: any) {
    console.error('Unexpected error caching cover_url:', err.message);
  }
}
