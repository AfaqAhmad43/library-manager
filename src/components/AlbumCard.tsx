'use client';

import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import { Album } from '@/types';

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <div className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/60 rounded-lg p-5 flex flex-col justify-between transition-all duration-200 h-full shadow-md backdrop-blur-sm">
      {/* Title & Artist */}
      <div>
        <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors duration-150 tracking-tight leading-snug line-clamp-2">
          {album.album_title}
        </h3>
        <p className="text-sm font-medium text-zinc-400 mt-1 line-clamp-1">
          {album.artist}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {/* Year and Scope Info */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-850">
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

        {/* Read-Only Format Checkboxes */}
        <div className="flex items-center justify-between py-1.5 bg-zinc-950/30 border border-zinc-850/60 rounded px-2.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 cursor-default select-none">
            <input
              type="checkbox"
              checked={album.digital}
              readOnly
              className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-800 text-zinc-200 focus:ring-0 focus:ring-offset-0 pointer-events-none accent-zinc-200"
            />
            Digital
          </label>

          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 cursor-default select-none">
            <input
              type="checkbox"
              checked={album.cd}
              readOnly
              className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-800 text-zinc-200 focus:ring-0 focus:ring-offset-0 pointer-events-none accent-zinc-200"
            />
            CD
          </label>

          <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 cursor-default select-none">
            <input
              type="checkbox"
              checked={album.vinyl}
              readOnly
              className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-800 text-zinc-200 focus:ring-0 focus:ring-offset-0 pointer-events-none accent-zinc-200"
            />
            Vinyl
          </label>
        </div>

        {/* Album Notes */}
        {album.notes && (
          <div 
            className="pt-3 border-t border-zinc-850 text-xs text-zinc-500 italic leading-relaxed line-clamp-3"
            title={album.notes}
          >
            &ldquo;{album.notes}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
