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
      <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-lg transition-all duration-300 hover:shadow-black/20">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total cataloged</p>
          <p className="text-3xl font-bold text-zinc-100 mt-1.5 tracking-tight font-mono">{totalAlbums}</p>
        </div>
        <div className="p-3 bg-zinc-800/40 border border-white/5 rounded-xl text-zinc-400">
          <Music className="w-5 h-5" />
        </div>
      </div>

      {/* Physical Holdings (CD/Vinyl) */}
      <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-lg transition-all duration-300 hover:shadow-black/20">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Physical Media</p>
          <p className="text-3xl font-bold text-violet-500 mt-1.5 tracking-tight font-mono">{physicalCount}</p>
        </div>
        <div className="p-3 bg-violet-500/10 border border-violet-500/15 rounded-xl text-violet-400">
          <Disc className="w-5 h-5" />
        </div>
      </div>

      {/* Digital Holdings */}
      <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-lg transition-all duration-300 hover:shadow-black/20">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Digital Files</p>
          <p className="text-3xl font-bold text-teal-500 mt-1.5 tracking-tight font-mono">{digitalCount}</p>
        </div>
        <div className="p-3 bg-teal-500/10 border border-teal-500/15 rounded-xl text-teal-400">
          <FileAudio className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
