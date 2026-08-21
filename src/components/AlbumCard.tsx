'use client';

import React from 'react';
import { Calendar, Disc, Layers } from 'lucide-react';
import { Album, MasteringStatus } from '@/types';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  // Get color styles based on Mastering Status
  const getStatusBadgeStyle = (status: MasteringStatus) => {
    switch (status) {
      case 'CD/Digital Match':
        return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50';
      case 'Other Master Superior':
        return 'bg-violet-950/30 text-violet-400 border-violet-900/50';
      case 'Needs Research':
      default:
        return 'bg-amber-950/30 text-amber-400 border-amber-900/50';
    }
  };

  return (
    <div className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/60 rounded-lg p-5 flex flex-col justify-between transition-all duration-200 h-full shadow-md backdrop-blur-sm">
      <div>
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors duration-150 tracking-tight leading-snug line-clamp-2">
            {album.album_title}
          </h3>
        </div>
        <p className="text-sm font-medium text-zinc-400 mt-1 line-clamp-1">
          {album.artist}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800/60 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-mono">{album.year || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-600" />
            <span className="bg-zinc-800/60 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/40 font-medium">
              {album.scope}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            Mastering
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded border ${getStatusBadgeStyle(
              album.mastering_status
            )}`}
          >
            {album.mastering_status}
          </span>
        </div>
      </div>
    </div>
  );
}
