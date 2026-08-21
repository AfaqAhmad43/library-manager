export type Scope = 'Full' | 'Partial' | 'Few' | 'Single';

export type MasteringStatus = 
  | 'CD/Digital Match' 
  | 'Other Master Superior' 
  | 'Needs Research';

export interface Album {
  id: string;
  created_at: string;
  artist: string;
  album_title: string;
  year: string;
  scope: Scope;
  mastering_status: MasteringStatus;
}
