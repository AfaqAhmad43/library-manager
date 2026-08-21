'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Layers, FileText } from 'lucide-react';
import { Album } from '@/types';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [loadingArt, setLoadingArt] = useState(true);

  // Fetch cover art from iTunes Search API
  useEffect(() => {
    let active = true;
    setLoadingArt(true);
    setImgError(false);

    const fetchArtwork = async () => {
      try {
        const query = `${album.artist} ${album.album_title}`;
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=1`
        );
        if (!response.ok) throw new Error('iTunes API error');
        const data = await response.json();

        if (active) {
          if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
            // Upscale from 100x100 to 600x600 for high resolution
            const highRes = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            setArtworkUrl(highRes);
          } else {
            setArtworkUrl(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch iTunes artwork for:', album.album_title, err);
        if (active) setArtworkUrl(null);
      } finally {
        if (active) setLoadingArt(false);
      }
    };

    fetchArtwork();
    return () => {
      active = false;
    };
  }, [album.artist, album.album_title]);

  // Generate minimalist background based on album title letters for variety
  const getGradientClass = () => {
    const charCode = (album.album_title.charCodeAt(0) || 0) + (album.artist.charCodeAt(0) || 0);
    const index = charCode % 4;
    switch (index) {
      case 0: return 'from-slate-900 via-zinc-950 to-neutral-900';
      case 1: return 'from-zinc-900 via-neutral-950 to-stone-900';
      case 2: return 'from-slate-950 via-zinc-900 to-zinc-950';
      default: return 'from-stone-950 via-zinc-950 to-neutral-900';
    }
  };

  const getInitials = () => {
    const a = album.artist.charAt(0) || '';
    const t = album.album_title.charAt(0) || '';
    return `${a}${t}`.toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50 rounded-lg p-4 flex flex-col justify-between transition-all duration-200 h-full shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none"
    >
      <div>
        {/* Album Cover Container */}
        <div className="relative w-full aspect-square bg-zinc-950/80 border border-zinc-850/65 rounded overflow-hidden mb-4 group-hover:border-zinc-750/50 transition-colors duration-200">
          {loadingArt ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
              <div className="w-6 h-6 border-2 border-zinc-750 border-t-zinc-400 rounded-full animate-spin" />
            </div>
          ) : artworkUrl && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={artworkUrl}
              alt={`${album.album_title} cover`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          ) : (
            /* Fallback Minimalist Art Card */
            <div className={`w-full h-full bg-gradient-to-br ${getGradientClass()} flex flex-col justify-between p-4 relative overflow-hidden select-none pointer-events-none`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-650 font-mono">
                  No Cover
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/40 text-zinc-500 font-mono">
                  {album.scope}
                </span>
              </div>
              <div className="z-10 mt-auto">
                <p className="text-xs font-bold text-zinc-400 leading-tight line-clamp-2">{album.album_title}</p>
                <p className="text-[10px] text-zinc-550 mt-0.5 font-medium line-clamp-1">{album.artist}</p>
              </div>
              <span className="text-5xl font-black text-zinc-800/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono tracking-tighter uppercase select-none">
                {getInitials()}
              </span>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div>
          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors duration-150 tracking-tight leading-snug line-clamp-2">
            {album.album_title}
          </h3>
          <p className="text-xs font-medium text-zinc-450 mt-0.5 line-clamp-1">
            {album.artist}
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {album.digital && (
            <span className="bg-teal-950/20 text-teal-400 border border-teal-900/35 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
              Digital
            </span>
          )}
          {album.cd && (
            <span className="bg-violet-950/20 text-violet-400 border border-violet-900/35 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
              CD
            </span>
          )}
          {album.vinyl && (
            <span className="bg-amber-950/20 text-amber-400 border border-amber-900/35 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
              Vinyl
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-850/60 space-y-2">
        {/* Year and Scope Info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-650" />
            <span className="font-mono">{album.year || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-zinc-850/50 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800/40 text-[10px] font-semibold">
              {album.scope}
            </span>
          </div>
        </div>

        {/* Notes Snippet Indicator */}
        {album.notes ? (
          <div className="text-[11px] text-zinc-550 flex items-start gap-1 bg-zinc-950/20 rounded p-1.5 border border-zinc-850/30">
            <FileText className="w-3.5 h-3.5 text-zinc-650 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic leading-tight">&ldquo;{album.notes}&rdquo;</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
