'use client';

import React from 'react';
import { Music, Disc, FileAudio } from 'lucide-react';
import { Album } from '@/types';

interface StatsBarProps {
  albums: Album[];
}

export default function StatsBar({ albums }: StatsBarProps) {
  const totalAlbums = albums.length;
  
  // Calculate physical albums (has CD or Vinyl or both checked)
  const physicalCount = albums.filter(
    (album) => album.cd || album.vinyl
  ).length;

  // Calculate digital albums
  const digitalCount = albums.filter(
    (album) => album.digital
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total Albums */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Albums</p>
          <p className="text-3xl font-bold text-zinc-100 mt-1 tracking-tight">{totalAlbums}</p>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg text-zinc-300">
          <Music className="w-5 h-5" />
        </div>
      </div>

      {/* Physical Holdings (CD/Vinyl) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Physical Media</p>
          <p className="text-3xl font-bold text-violet-500 mt-1 tracking-tight">{physicalCount}</p>
        </div>
        <div className="p-3 bg-violet-950/20 border border-violet-900/30 rounded-lg text-violet-400">
          <Disc className="w-5 h-5" />
        </div>
      </div>

      {/* Digital Holdings */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Digital Files</p>
          <p className="text-3xl font-bold text-teal-500 mt-1 tracking-tight">{digitalCount}</p>
        </div>
        <div className="p-3 bg-teal-950/20 border border-teal-900/30 rounded-lg text-teal-400">
          <FileAudio className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
