'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { Album } from '@/types';
import { saveCoverUrl } from '@/app/actions';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

// ── Artwork fetching helpers ──────────────────────────────────────────────

/** iTunes Search API — returns high-res (600×600) URL or null */
async function fetchItunesArt(artist: string, title: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const url: string | undefined = json.results?.[0]?.artworkUrl100;
    return url ? url.replace('100x100bb', '600x600bb') : null;
  } catch {
    return null;
  }
}

/** MusicBrainz + Cover Art Archive — returns image URL or null */
async function fetchCaaArt(artist: string, title: string): Promise<string | null> {
  try {
    // 1. Search for the release group on MusicBrainz
    const q = encodeURIComponent(`release:${title} artist:${artist}`);
    const mbRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group?query=${q}&fmt=json&limit=1`,
      {
        headers: { 'User-Agent': 'LibraryBuddy/1.0 (github.com/AfaqAhmad43/library-manager)' },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!mbRes.ok) return null;
    const mbJson = await mbRes.json();
    const mbid: string | undefined = mbJson['release-groups']?.[0]?.id;
    if (!mbid) return null;

    // 2. Fetch cover from Cover Art Archive
    const caaRes = await fetch(
      `https://coverartarchive.org/release-group/${mbid}/front`,
      { redirect: 'follow', signal: AbortSignal.timeout(6000) }
    );
    if (!caaRes.ok) return null;
    return caaRes.url; // redirected final image URL
  } catch {
    return null;
  }
}

// ── Gradient / typographic fallback helpers ───────────────────────────────
const GRADIENTS = [
  'from-slate-900 via-zinc-950 to-neutral-900',
  'from-zinc-900 via-neutral-950 to-stone-900',
  'from-slate-950 via-zinc-900 to-zinc-950',
  'from-stone-950 via-zinc-950 to-neutral-900',
  'from-neutral-900 via-slate-950 to-zinc-900',
  'from-zinc-950 via-stone-900 to-slate-950',
];

function getGradient(artist: string, title: string) {
  const code = (artist.charCodeAt(0) || 0) + (title.charCodeAt(0) || 0);
  return GRADIENTS[code % GRADIENTS.length];
}

function getInitials(artist: string, title: string) {
  return `${artist.charAt(0)}${title.charAt(0)}`.toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  const [artUrl, setArtUrl]         = useState<string | null>(album.cover_url || null);
  const [imgError, setImgError]     = useState(false);
  const [loading, setLoading]       = useState(!album.cover_url);
  const cacheSaved                  = useRef(!!album.cover_url); // don't re-save if already cached

  useEffect(() => {
    // Step 1 — already have a cached URL
    if (album.cover_url) {
      setArtUrl(album.cover_url);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setImgError(false);

      // Step 2 — iTunes
      let url = await fetchItunesArt(album.artist, album.album_title);

      // Step 3 — Cover Art Archive
      if (!url) {
        url = await fetchCaaArt(album.artist, album.album_title);
      }

      if (cancelled) return;

      if (url) {
        setArtUrl(url);
        // Step — background cache write (fire-and-forget)
        if (!cacheSaved.current) {
          cacheSaved.current = true;
          saveCoverUrl(album.id, url).catch(() => {});
        }
      } else {
        setArtUrl(null); // Step 4 — graceful gradient fallback
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id, album.cover_url]);

  const showArt    = !loading && artUrl && !imgError;
  const showGrad   = !loading && (!artUrl || imgError);
  const gradient   = getGradient(album.artist, album.album_title);
  const initials   = getInitials(album.artist, album.album_title);

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50 rounded-lg p-4 flex flex-col gap-3 transition-all duration-200 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none"
    >
      {/* ── Cover Art ───────────────────────────────────────────── */}
      <div className="relative w-full aspect-square rounded overflow-hidden bg-zinc-950 border border-zinc-850/60 group-hover:border-zinc-750/50 transition-colors">
        {/* Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Real artwork */}
        {showArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl!}
            alt={`${album.album_title} cover`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Gradient / typographic fallback */}
        {showGrad && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-between p-3.5 overflow-hidden`}
          >
            {/* Top row */}
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 font-mono">
                No Cover
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/40 text-zinc-500 font-mono">
                {album.scope}
              </span>
            </div>

            {/* Giant initials watermark */}
            <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-black text-zinc-800/20 font-mono tracking-tighter pointer-events-none select-none">
              {initials}
            </span>

            {/* Bottom copy */}
            <div className="z-10">
              <p className="text-xs font-bold text-zinc-300 leading-tight line-clamp-2">{album.album_title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{album.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metadata ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Title + artist */}
        <div>
          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white leading-snug line-clamp-2 tracking-tight">
            {album.album_title}
          </h3>
          <p className="text-xs font-medium text-zinc-450 mt-0.5 line-clamp-1">{album.artist}</p>
        </div>

        {/* Format badges */}
        <div className="flex flex-wrap gap-1">
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

        {/* Year + scope + notes indicator */}
        <div className="pt-2 border-t border-zinc-850/50 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-650" />
            <span className="font-mono">{album.year || 'N/A'}</span>
          </div>
          <span className="bg-zinc-850/50 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800/40 text-[10px] font-semibold">
            {album.scope}
          </span>
        </div>

        {album.notes && (
          <div className="text-[11px] text-zinc-550 flex items-start gap-1 bg-zinc-950/20 rounded p-1.5 border border-zinc-850/30">
            <FileText className="w-3.5 h-3.5 text-zinc-650 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1 italic">&ldquo;{album.notes}&rdquo;</span>
          </div>
        )}
      </div>
    </div>
  );
}
