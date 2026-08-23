'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2, Link, ArrowRightLeft, Copy } from 'lucide-react';
import { updateAlbum, moveAlbumToLibrary } from '@/app/actions';
import { Album, Scope } from '@/types';

interface EditAlbumDrawerProps {
  isOpen: boolean;
  album: Album | null;
  table: 'albums' | 'unsorted';
  onClose: () => void;
  onAlbumUpdated: (updatedAlbum: Album) => void;
  onAlbumMoved?: (albumId: string) => void;
}

export default function EditAlbumDrawer({
  isOpen,
  album,
  table,
  onClose,
  onAlbumUpdated,
  onAlbumMoved,
}: EditAlbumDrawerProps) {
  const [artist, setArtist]           = useState('');
  const [albumTitle, setAlbumTitle]   = useState('');
  const [year, setYear]               = useState('');
  const [scope, setScope]             = useState<Scope>('Full');
  const [digital, setDigital]         = useState(false);
  const [cd, setCd]                   = useState(false);
  const [vinyl, setVinyl]             = useState(false);
  const [notes, setNotes]             = useState('');
  const [coverUrl, setCoverUrl]       = useState('');

  const [isLoading, setIsLoading]     = useState(false);
  const [isMoving, setIsMoving]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  // Warning confirmation for duplicates
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Markdown copy state
  const [copiedMd, setCopiedMd]       = useState(false);

  // Ref to trap focus inside the drawer panel
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape + lock background scroll + focus first input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
      // Focus first focusable element inside the panel after animation settles
      const timer = setTimeout(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onClose]);

  // Populate form when album changes
  useEffect(() => {
    if (album) {
      setArtist(album.artist);
      setAlbumTitle(album.album_title);
      setYear(album.year || '');
      setScope(album.scope);
      setDigital(album.digital);
      setCd(album.cd);
      setVinyl(album.vinyl);
      setNotes(album.notes || '');
      setCoverUrl(album.cover_url || '');
      setError(null);
      setSuccess(false);
      setCopiedMd(false);
      setShowDuplicateWarning(false);
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(false);

    if (!artist.trim())      { setError('Artist name is required.'); return; }
    if (!albumTitle.trim())  { setError('Album title is required.'); return; }

    setIsLoading(true);
    try {
      const res = await updateAlbum(table, album.id, {
        artist,
        album_title: albumTitle,
        year,
        scope,
        digital,
        cd,
        vinyl,
        notes,
        cover_url: coverUrl,
      });

      if (!res.success || !res.data) {
        setError(res.error || 'Failed to update. Please try again.');
      } else {
        setSuccess(true);
        onAlbumUpdated(res.data);
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async (force = false) => {
    setError(null);
    setSuccess(false);

    // Run duplicate check first (unless forced)
    if (!force) {
      setIsMoving(true);
      let isDuplicate = false;
      try {
        const { checkAlbumDuplicate } = await import('@/app/actions');
        isDuplicate = await checkAlbumDuplicate(artist, albumTitle);
      } catch (err: any) {
        console.error('Duplicate check error:', err);
      }

      if (isDuplicate) {
        // Bug fix: reset isMoving before early return so the button re-enables
        setIsMoving(false);
        setShowDuplicateWarning(true);
        return;
      }
    }

    setShowDuplicateWarning(false);
    setIsMoving(true);
    try {
      const res = await moveAlbumToLibrary(album.id);
      if (!res.success) {
        setError(res.error || 'Failed to move album.');
      } else {
        setSuccess(true);
        if (onAlbumMoved) {
          onAlbumMoved(album.id);
        }
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleCopyMarkdown = () => {
    const formats = [
      digital ? 'Digital' : '',
      cd ? 'CD' : '',
      vinyl ? 'Vinyl' : ''
    ].filter(Boolean).join(', ') || 'None';

    const md = `### ${albumTitle}
- **Artist:** ${artist}
- **Year:** ${year || 'N/A'}
- **Scope:** ${scope}
- **Format Holdings:** ${formats}
${notes.trim() ? `\n**Notes:**\n${notes.trim()}` : ''}`;

    navigator.clipboard.writeText(md).catch(console.error);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2050);
  };

  const inputCls =
    'w-full bg-zinc-900 border border-white/5 focus:border-zinc-500 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-zinc-500/20 text-zinc-100 transition-all placeholder:text-zinc-600 disabled:opacity-50 font-sans';
  const labelCls =
    'text-[10px] font-bold text-zinc-500 uppercase tracking-widest';
  const disabled = isLoading || isMoving || success;

  return (
    <>
      {/* Backdrop overlay — CSS keyframes declared in globals.css */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Album Details"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end drawer-fade"
      >
        {/* Panel surface */}
        <div
          ref={panelRef}
          className="bg-zinc-950 border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl drawer-slide"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Album Details</h2>
              <p className="text-[10px] text-zinc-500 uppercase mt-0.5 tracking-wider">
                Editing inside {table === 'albums' ? 'Main Library' : 'Unsorted queue'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-900 border border-white/5"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

            {error && (
              <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg p-3.5">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-lg p-3.5 flex items-center gap-2">
                <Check className="w-4 h-4" /> Action completed successfully!
              </div>
            )}

            {/* Duplicate Soft Warning Panel */}
            {showDuplicateWarning && (
              <div className="bg-amber-950/20 border border-amber-900/30 text-amber-400 p-4 rounded-lg text-xs space-y-3 shadow-lg">
                <p className="font-bold uppercase tracking-wider text-[10px]">Duplicate Entry Detected</p>
                <p className="leading-relaxed">
                  An album titled &ldquo;{albumTitle}&rdquo; by &ldquo;{artist}&rdquo; already exists in your Main Library.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMove(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded font-bold transition-colors"
                  >
                    Move Anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDuplicateWarning(false)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 px-3 py-1.5 rounded transition-colors"
                  >
                    Cancel Move
                  </button>
                </div>
              </div>
            )}

            {/* Artist */}
            <div className="space-y-1.5">
              <label htmlFor="d-artist" className={labelCls}>Artist <span className="text-red-500">*</span></label>
              <input id="d-artist" type="text" value={artist} onChange={(e) => setArtist(e.target.value)} className={inputCls} disabled={disabled} required />
            </div>

            {/* Album Title */}
            <div className="space-y-1.5">
              <label htmlFor="d-title" className={labelCls}>Album Title <span className="text-red-500">*</span></label>
              <input id="d-title" type="text" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} className={inputCls} disabled={disabled} required />
            </div>

            {/* Year + Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="d-year" className={labelCls}>Year</label>
                <input id="d-year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 1973" className={inputCls} disabled={disabled} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="d-scope" className={labelCls}>Scope</label>
                <select id="d-scope" value={scope} onChange={(e) => setScope(e.target.value as Scope)} className={inputCls} disabled={disabled}>
                  <option value="Full">Full</option>
                  <option value="Partial">Partial</option>
                  <option value="Few">Few</option>
                  <option value="Single">Single</option>
                </select>
              </div>
            </div>

            {/* Formats */}
            <div className="space-y-2">
              <span className={labelCls}>Format Holdings</span>
              <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 border border-white/5 rounded-lg p-3">
                {([['digital', digital, setDigital], ['cd', cd, setCd], ['vinyl', vinyl, setVinyl]] as const).map(
                  ([label, val, setter]: any) => (
                    <label key={label} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300 cursor-pointer select-none capitalize">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setter(e.target.checked)}
                        className="w-4 h-4 rounded bg-zinc-900 border-white/10 text-zinc-100 cursor-pointer accent-zinc-200"
                        disabled={disabled}
                      />
                      {label === 'cd' ? 'CD' : label}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Notes Section with Markdown Copy */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="d-notes" className={labelCls}>Notes</label>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors border border-white/5"
                >
                  {copiedMd ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy as Markdown
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="d-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter research sources, mastering notes…"
                rows={4}
                className={`${inputCls} resize-none`}
                disabled={disabled}
              />
            </div>

            {/* Cover Art URL */}
            <div className="space-y-1.5">
              <label htmlFor="d-cover" className={labelCls}>
                <Link className="w-3 h-3 inline mr-1 -mt-0.5" />
                Artwork URL <span className="text-zinc-600 font-normal lowercase tracking-normal">(override)</span>
              </label>
              <input
                id="d-cover"
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className={inputCls}
                disabled={disabled}
              />
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="mt-2 w-20 h-20 rounded-lg object-cover border border-white/5 shadow-md"
                />
              )}
            </div>

          </form>

          {/* Footer controls */}
          <div className="p-5 border-t border-white/5 bg-zinc-950 flex flex-col gap-3 flex-shrink-0">
            {table === 'unsorted' && (
              <button
                type="button"
                onClick={() => handleMove(false)}
                disabled={disabled}
                className="w-full bg-violet-700 hover:bg-violet-600 text-white py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isMoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Moving to Library...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    Move to Main Library
                  </>
                )}
              </button>
            )}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={disabled}
                className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                ) : success ? (
                  <><Check className="w-4 h-4" />Saved</>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
