'use client';

import React from 'react';
import { Music, AlertCircle, Disc } from 'lucide-react';
import { Album } from '@/types';

interface StatsBarProps {
  albums: Album[];
}

export default function StatsBar({ albums }: StatsBarProps) {
  const totalAlbums = albums.length;
  
  const needsResearchCount = albums.filter(
    (album) => album.mastering_status === 'Needs Research'
  ).length;

  const matchedMastersCount = albums.filter(
    (album) => album.mastering_status === 'CD/Digital Match'
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

      {/* Items Needing Research */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Needs Research</p>
          <p className="text-3xl font-bold text-amber-500 mt-1 tracking-tight">{needsResearchCount}</p>
        </div>
        <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-500">
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Matched Masters */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Matched Masters</p>
          <p className="text-3xl font-bold text-emerald-500 mt-1 tracking-tight">{matchedMastersCount}</p>
        </div>
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-emerald-500">
          <Disc className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
