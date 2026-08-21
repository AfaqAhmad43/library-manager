export type Scope = 'Full' | 'Partial' | 'Few' | 'Single';

export interface Album {
  id: string;
  created_at: string;
  artist: string;
  album_title: string;
  year: string;
  scope: Scope;
  digital: boolean;
  cd: boolean;
  vinyl: boolean;
  notes: string;
}
