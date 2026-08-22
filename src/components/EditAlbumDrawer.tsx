'use client';

import React, { useState, useEffect } from 'react';
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
  
  // Markdown copy state
  const [copiedMd, setCopiedMd]       = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  const handleMove = async () => {
    setError(null);
    setSuccess(false);
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

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2050);
  };

  const inputCls =
    'w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650 disabled:opacity-50';
  const labelCls =
    'text-xs font-semibold text-zinc-400 uppercase tracking-wider';
  const disabled = isLoading || isMoving || success;

  return (
    <>
      <style jsx global>{`
        @keyframes drawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes drawerFadeIn  { from { opacity: 0; }               to { opacity: 1; } }
        .drawer-slide { animation: drawerSlideIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
        .drawer-fade  { animation: drawerFadeIn  0.2s ease-out forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end drawer-fade"
      >
        {/* Panel */}
        <div className="bg-zinc-900 border-l border-zinc-800/80 w-full max-w-md h-full flex flex-col shadow-2xl drawer-slide">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Album Details</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Edit album in {table === 'albums' ? 'Main Library' : 'Unsorted List'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

            {error && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded p-3 flex items-center gap-2">
                <Check className="w-4 h-4" /> Action completed successfully!
              </div>
            )}

            {/* Artist */}
            <div className="space-y-1">
              <label htmlFor="d-artist" className={labelCls}>Artist <span className="text-red-500">*</span></label>
              <input id="d-artist" type="text" value={artist} onChange={(e) => setArtist(e.target.value)} className={inputCls} disabled={disabled} required />
            </div>

            {/* Album Title */}
            <div className="space-y-1">
              <label htmlFor="d-title" className={labelCls}>Album Title <span className="text-red-500">*</span></label>
              <input id="d-title" type="text" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} className={inputCls} disabled={disabled} required />
            </div>

            {/* Year + Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="d-year" className={labelCls}>Year</label>
                <input id="d-year" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 1973" className={inputCls} disabled={disabled} />
              </div>
              <div className="space-y-1">
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
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 border border-zinc-800 rounded p-3">
                {([['digital', digital, setDigital], ['cd', cd, setCd], ['vinyl', vinyl, setVinyl]] as const).map(
                  ([label, val, setter]: any) => (
                    <label key={label} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none capitalize">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setter(e.target.checked)}
                        className="w-4 h-4 rounded accent-zinc-105 cursor-pointer bg-zinc-900 border-zinc-800 text-zinc-100"
                        disabled={disabled}
                      />
                      {label === 'cd' ? 'CD' : label.charAt(0).toUpperCase() + label.slice(1)}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Notes Section with Copy as Markdown */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="d-notes" className={labelCls}>Notes</label>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="text-[10px] bg-zinc-800/80 hover:bg-zinc-750 text-zinc-350 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-zinc-800"
                >
                  {copiedMd ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400 animate-fade-in" />
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
                placeholder="Enter mastering comments, research notes…"
                rows={4}
                className={`${inputCls} resize-none font-sans`}
                disabled={disabled}
              />
            </div>

            {/* Cover Art URL (manual override) */}
            <div className="space-y-1">
              <label htmlFor="d-cover" className={labelCls}>
                <Link className="w-3 h-3 inline mr-1 -mt-0.5" />
                Artwork URL <span className="text-zinc-650 font-normal normal-case tracking-normal">(optional override)</span>
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
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="mt-2 w-20 h-20 rounded object-cover border border-zinc-800"
                />
              )}
            </div>

          </form>

          {/* Footer */}
          <div className="p-5 border-t border-zinc-800/60 bg-zinc-900/60 flex flex-col gap-3 flex-shrink-0">
            {table === 'unsorted' && (
              <button
                type="button"
                onClick={handleMove}
                disabled={disabled}
                className="w-full bg-violet-650 hover:bg-violet-600 text-white py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
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
              <button type="button" onClick={onClose} disabled={disabled}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 py-2.5 px-4 rounded font-semibold text-sm transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="" onClick={handleSubmit} disabled={disabled}
                className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-55">
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
