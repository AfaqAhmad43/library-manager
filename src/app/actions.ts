'use server';

import { supabase } from '@/lib/supabase';
import { Album, Scope } from '@/types';

// ─────────────────────────────────────────────
//  GET ALL ALBUMS (Dynamic Table)
// ─────────────────────────────────────────────
export async function getAlbums(
  table: 'albums' | 'unsorted' = 'albums'
): Promise<{
  success: boolean;
  data: Album[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as Album[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Unexpected error.' };
  }
}

// ─────────────────────────────────────────────
//  ADD ALBUM (Dynamic Table)
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
  table: 'albums' | 'unsorted',
  input: AlbumInput
): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    if (!input.artist.trim())       return { success: false, error: 'Artist name is required.' };
    if (!input.album_title.trim())  return { success: false, error: 'Album title is required.' };

    const { data, error } = await supabase
      .from(table)
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
//  UPDATE ALBUM (Dynamic Table)
// ─────────────────────────────────────────────
export async function updateAlbum(
  table: 'albums' | 'unsorted',
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
      .from(table)
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
//  MOVE ALBUM FROM UNSORTED TO MAIN LIBRARY
// ─────────────────────────────────────────────
export async function moveAlbumToLibrary(
  id: string
): Promise<{ success: boolean; data?: Album; error?: string }> {
  try {
    // 1. Fetch record from unsorted
    const { data: unsortedAlbum, error: fetchError } = await supabase
      .from('unsorted')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !unsortedAlbum) {
      console.error('Error fetching from unsorted table:', fetchError);
      return { success: false, error: fetchError?.message || 'Album not found in Unsorted table.' };
    }

    // 2. Insert into albums
    const { data: insertedAlbum, error: insertError } = await supabase
      .from('albums')
      .insert([{
        artist:       unsortedAlbum.artist,
        album_title:  unsortedAlbum.album_title,
        year:         unsortedAlbum.year,
        scope:        unsortedAlbum.scope,
        digital:      unsortedAlbum.digital,
        cd:           unsortedAlbum.cd,
        vinyl:        unsortedAlbum.vinyl,
        notes:        unsortedAlbum.notes,
        cover_url:    unsortedAlbum.cover_url,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting into albums table:', insertError);
      return { success: false, error: insertError.message };
    }

    // 3. Delete from unsorted
    const { error: deleteError } = await supabase
      .from('unsorted')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // Log it but continue since it's already copied
      console.error('Warning: Failed to delete from unsorted table after merge:', deleteError);
    }

    return { success: true, data: insertedAlbum as Album };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error during move.' };
  }
}
