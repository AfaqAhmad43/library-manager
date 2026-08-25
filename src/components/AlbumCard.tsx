'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, FileAudio, Disc } from 'lucide-react';
import { Album } from '@/types';
import { persistCoverUrl } from '@/app/actions';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
  table: 'albums' | 'unsorted';
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

// ── Tier 2: iTunes Search API ─────────────────────────────────────────────
async function fetchItunesArt(artist: string, title: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const raw: string | undefined = json.results?.[0]?.artworkUrl100;
    return raw ? raw.replace('100x100bb', '600x600bb') : null;
  } catch {
    return null;
  }
}

// ── Tier 3: MusicBrainz + Cover Art Archive ───────────────────────────────
async function fetchCaaArt(artist: string, title: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`release:${title} artist:${artist}`);
    const mbRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group?query=${q}&fmt=json&limit=1`,
      {
        headers: {
          'User-Agent': 'LibraryBuddy/1.0 (github.com/AfaqAhmad43/library-manager)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(7000),
      }
    );
    if (!mbRes.ok) return null;
    const mbJson = await mbRes.json();
    const mbid: string | undefined = mbJson['release-groups']?.[0]?.id;
    if (!mbid) return null;

    const caaRes = await fetch(
      `https://coverartarchive.org/release-group/${mbid}/front`,
      { redirect: 'follow', signal: AbortSignal.timeout(7000) }
    );
    if (!caaRes.ok) return null;
    return caaRes.url;
  } catch {
    return null;
  }
}

// ── Gorgeous Ambient Fallback Gradients ──────────────────────────────────
const GRADIENTS = [
  'from-purple-950/80 via-zinc-950 to-indigo-950/80',
  'from-amber-950/70 via-zinc-950 to-rose-950/70',
  'from-teal-950/70 via-zinc-950 to-emerald-950/70',
  'from-fuchsia-950/70 via-zinc-950 to-violet-950/70',
  'from-blue-950/70 via-zinc-950 to-slate-950/70',
  'from-cyan-950/70 via-zinc-950 to-zinc-950',
];

function getGradient(artist: string, title: string) {
  const code = (artist.charCodeAt(0) || 0) + (title.charCodeAt(0) || 0);
  return GRADIENTS[code % GRADIENTS.length];
}
function getInitials(artist: string, title: string) {
  return `${artist.charAt(0)}${title.charAt(0)}`.toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────
export default function AlbumCard({ album, onClick, table, isSelected, onSelect }: AlbumCardProps) {
  const [artUrl, setArtUrl]     = useState<string | null>(album.cover_url || null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading]   = useState(!album.cover_url);

  // Reset cacheSaved whenever the album identity changes so that
  // a newly rendered card (after album.id changes) can persist its URL.
  const cacheSaved = useRef(!!album.cover_url);
  const prevAlbumId = useRef(album.id);
  if (prevAlbumId.current !== album.id) {
    prevAlbumId.current = album.id;
    cacheSaved.current = !!album.cover_url;
  }

  useEffect(() => {
    if (album.cover_url) {
      setArtUrl(album.cover_url);
      setImgError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setImgError(false);
      setArtUrl(null);

      let resolvedUrl: string | null = await fetchItunesArt(album.artist, album.album_title);

      if (!resolvedUrl) {
        resolvedUrl = await fetchCaaArt(album.artist, album.album_title);
      }

      if (cancelled) return;

      if (resolvedUrl) {
        setArtUrl(resolvedUrl);
        // Guard persist call: check cancelled again after the async persist
        if (!cacheSaved.current) {
          const saved = await persistCoverUrl(table, album.id, resolvedUrl);
          if (!cancelled && saved) {
            cacheSaved.current = true;
          }
        }
      } else {
        setArtUrl(null);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id, album.cover_url, table]);

  // ── Animated Skeleton Loader State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3.5 animate-pulse shadow-md select-none">
        {/* Artwork Shape */}
        <div className="w-full aspect-square rounded-lg bg-zinc-800/50" />
        {/* Metadata Lines */}
        <div className="space-y-2 mt-1">
          <div className="h-4 bg-zinc-800/70 rounded w-3/4" />
          <div className="h-3 bg-zinc-850/70 rounded w-1/2" />
        </div>
        {/* Badges Shape */}
        <div className="flex gap-2 mt-1">
          <div className="w-7 h-7 bg-zinc-850/60 rounded" />
          <div className="w-7 h-7 bg-zinc-850/60 rounded" />
        </div>
        {/* Divider & Footer Shape */}
        <div className="pt-3 border-t border-zinc-850/30 flex justify-between items-center">
          <div className="h-3.5 bg-zinc-850/40 rounded w-1/4" />
          <div className="h-3.5 bg-zinc-850/40 rounded w-12" />
        </div>
      </div>
    );
  }

  const showArt  = artUrl && !imgError;
  const showGrad = !artUrl || imgError;
  const gradient = getGradient(album.artist, album.album_title);
  const initials = getInitials(album.artist, album.album_title);

  return (
    <div
      onClick={onClick}
      className={`group bg-zinc-900/30 hover:bg-zinc-900/60 border rounded-xl p-4 flex flex-col gap-3.5 transition-all duration-300 shadow-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-black/40 select-none ${
        isSelected
          ? 'border-zinc-200 bg-zinc-900/60 shadow-black/50 ring-1 ring-zinc-200/20'
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* ── Cover Art ───────────────────────────────────────────── */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-950 border border-white/5 transition-all duration-300">
        
        {/* Checkbox overlay for batch operations */}
        {onSelect && (
          <div className="absolute top-2 left-2 z-20">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}} // toggling is handled by click onSelect
              onClick={(e) => {
                e.stopPropagation();
                onSelect(e);
              }}
              className="w-4.5 h-4.5 rounded bg-zinc-950/90 border-white/10 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100 transition-colors"
            />
          </div>
        )}

        {/* Artwork image with hover scale */}
        {showArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl!}
            alt={`${album.album_title} cover art`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover pointer-events-none transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}

        {/* Typographic fallback */}
        {showGrad && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-between p-3.5 overflow-hidden transition-all`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 font-mono">
                No Cover
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950/80 border border-white/5 text-zinc-400 font-mono">
                {album.scope}
              </span>
            </div>

            {/* Ambient initials watermark */}
            <span className="absolute inset-0 flex items-center justify-center text-[4.5rem] font-black text-zinc-100/10 font-mono tracking-tighter pointer-events-none select-none">
              {initials}
            </span>

            <div className="z-10">
              <p className="text-xs font-bold text-zinc-200 leading-tight line-clamp-2">{album.album_title}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{album.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metadata ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white leading-snug line-clamp-2 tracking-tight">
            {album.album_title}
          </h3>
          <p className="text-xs font-medium text-zinc-450 mt-0.5 line-clamp-1">{album.artist}</p>
        </div>

        {/* Format Badges (Refactored into sleek, minimalist icon badges) */}
        <div className="flex items-center gap-1.5">
          {album.digital && (
            <span 
              className="p-1.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/15" 
              title="Digital Available"
            >
              <FileAudio className="w-3.5 h-3.5" />
            </span>
          )}
          {album.cd && (
            <span 
              className="p-1.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/15" 
              title="CD Available"
            >
              <Disc className="w-3.5 h-3.5" />
            </span>
          )}
          {album.vinyl && (
            <span 
              className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15" 
              title="Vinyl Available"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </span>
          )}
        </div>

        {/* Year + Scope */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-600" />
            <span className="font-mono text-zinc-400">{album.year || 'N/A'}</span>
          </div>
          <span className="bg-zinc-850/40 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5 text-[9px] font-bold uppercase tracking-wider">
            {album.scope}
          </span>
        </div>

        {/* Notes snippet */}
        {album.notes && (
          <div className="text-[11px] text-zinc-500 flex items-start gap-1 bg-zinc-950/40 rounded-lg p-2 border border-white/5">
            <FileText className="w-3.5 h-3.5 text-zinc-650 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic text-zinc-400">&ldquo;{album.notes}&rdquo;</span>
          </div>
        )}
      </div>
    </div>
  );
}
