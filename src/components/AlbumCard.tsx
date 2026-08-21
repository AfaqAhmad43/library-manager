'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { Album } from '@/types';
import { persistCoverUrl } from '@/lib/supabaseClient';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

// ── Tier 2: iTunes Search API ─────────────────────────────────────────────
async function fetchItunesArt(artist: string, title: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      console.warn(`[CoverArt] iTunes responded ${res.status} for "${title}"`);
      return null;
    }
    const json = await res.json();
    const raw: string | undefined = json.results?.[0]?.artworkUrl100;
    if (!raw) {
      console.info(`[CoverArt] iTunes: no results for "${artist} – ${title}"`);
      return null;
    }
    const url = raw.replace('100x100bb', '600x600bb');
    console.info(`[CoverArt] ✅ iTunes found artwork for "${title}":`, url);
    return url;
  } catch (err) {
    console.warn(`[CoverArt] iTunes fetch error for "${title}":`, err);
    return null;
  }
}

// ── Tier 3: MusicBrainz + Cover Art Archive ───────────────────────────────
async function fetchCaaArt(artist: string, title: string): Promise<string | null> {
  try {
    // Step A — find the release group MBID
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
    if (!mbRes.ok) {
      console.warn(`[CoverArt] MusicBrainz responded ${mbRes.status} for "${title}"`);
      return null;
    }
    const mbJson = await mbRes.json();
    const mbid: string | undefined = mbJson['release-groups']?.[0]?.id;
    if (!mbid) {
      console.info(`[CoverArt] MusicBrainz: no release group found for "${artist} – ${title}"`);
      return null;
    }
    console.info(`[CoverArt] MusicBrainz MBID for "${title}": ${mbid}`);

    // Step B — fetch front cover from Cover Art Archive
    const caaRes = await fetch(
      `https://coverartarchive.org/release-group/${mbid}/front`,
      { redirect: 'follow', signal: AbortSignal.timeout(7000) }
    );
    if (!caaRes.ok) {
      console.warn(`[CoverArt] CAA responded ${caaRes.status} for MBID ${mbid}`);
      return null;
    }
    // After redirects, caaRes.url is the final CDN image URL
    const url = caaRes.url;
    console.info(`[CoverArt] ✅ CAA found artwork for "${title}":`, url);
    return url;
  } catch (err) {
    console.warn(`[CoverArt] CAA fetch error for "${title}":`, err);
    return null;
  }
}

// ── Gradient fallback helpers ─────────────────────────────────────────────
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
  const [artUrl, setArtUrl]     = useState<string | null>(album.cover_url || null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading]   = useState(!album.cover_url);

  // Only attempt to cache once per mount — flipped to true ONLY after confirmed DB write
  const cacheSaved = useRef(!!album.cover_url);

  useEffect(() => {
    // ── Tier 1: DB cache hit ───────────────────────────────────────────────
    if (album.cover_url) {
      console.info(`[CoverArt] Cache hit for "${album.album_title}" → ${album.cover_url}`);
      setArtUrl(album.cover_url);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setImgError(false);
      console.info(`[CoverArt] No cached URL for "${album.album_title}" — starting fetch chain`);

      // ── Tier 2: iTunes ────────────────────────────────────────────────────
      let resolvedUrl: string | null = await fetchItunesArt(album.artist, album.album_title);

      // ── Tier 3: Cover Art Archive ─────────────────────────────────────────
      if (!resolvedUrl) {
        resolvedUrl = await fetchCaaArt(album.artist, album.album_title);
      }

      if (cancelled) {
        console.info(`[CoverArt] Component unmounted before fetch resolved for "${album.album_title}"`);
        return;
      }

      if (resolvedUrl) {
        // Update UI immediately
        setArtUrl(resolvedUrl);

        // ── Background cache write ──────────────────────────────────────────
        // Only attempt if we haven't successfully saved yet for this album
        if (!cacheSaved.current) {
          console.info(`[CoverArt] Attempting DB cache write for album ${album.id}…`);
          const saved = await persistCoverUrl(album.id, resolvedUrl);
          if (saved) {
            // Only flip flag after confirmed write
            cacheSaved.current = true;
          }
          // If it failed, cacheSaved stays false so it can be retried next render
        }
      } else {
        // ── Tier 4: Typographic gradient fallback ──────────────────────────
        console.info(`[CoverArt] All APIs exhausted — using gradient fallback for "${album.album_title}"`);
        setArtUrl(null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id, album.cover_url]);

  const showArt  = !loading && !!artUrl && !imgError;
  const showGrad = !loading && (!artUrl || imgError);
  const gradient = getGradient(album.artist, album.album_title);
  const initials = getInitials(album.artist, album.album_title);

  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/50 rounded-lg p-4 flex flex-col gap-3 transition-all duration-200 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] select-none"
    >
      {/* ── Cover Art ───────────────────────────────────────────── */}
      <div className="relative w-full aspect-square rounded overflow-hidden bg-zinc-950 border border-zinc-850/60 group-hover:border-zinc-750/50 transition-colors">

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Artwork image */}
        {showArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl!}
            alt={`${album.album_title} cover art`}
            onError={() => {
              console.warn(`[CoverArt] Image load failed for "${album.album_title}":`, artUrl);
              setImgError(true);
            }}
            className="w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Tier 4: Gradient typographic fallback */}
        {showGrad && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-between p-3.5 overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 font-mono">
                No Cover
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/40 text-zinc-500 font-mono">
                {album.scope}
              </span>
            </div>

            {/* Large initials watermark */}
            <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-black text-zinc-800/20 font-mono tracking-tighter pointer-events-none select-none">
              {initials}
            </span>

            <div className="z-10">
              <p className="text-xs font-bold text-zinc-300 leading-tight line-clamp-2">{album.album_title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{album.artist}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metadata ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
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

        {/* Year + Scope */}
        <div className="pt-2 border-t border-zinc-850/50 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-650" />
            <span className="font-mono">{album.year || 'N/A'}</span>
          </div>
          <span className="bg-zinc-850/50 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800/40 text-[10px] font-semibold">
            {album.scope}
          </span>
        </div>

        {/* Notes snippet */}
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
