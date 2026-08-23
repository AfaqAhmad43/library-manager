'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { addAlbum } from '@/app/actions';
import { Album, Scope } from '@/types';

interface AddAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlbumAdded: (newAlbum: Album) => void;
  table: 'albums' | 'unsorted';
}

export default function AddAlbumModal({ isOpen, onClose, onAlbumAdded, table }: AddAlbumModalProps) {
  const [artist, setArtist] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [year, setYear] = useState('');
  const [scope, setScope] = useState<Scope>('Full');
  const [digital, setDigital] = useState(false);
  const [cd, setCd] = useState(false);
  const [vinyl, setVinyl] = useState(false);
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll and focus the first input on modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setArtist('');
      setAlbumTitle('');
      setYear('');
      setScope('Full');
      setDigital(false);
      setCd(false);
      setVinyl(false);
      setNotes('');
      setCoverUrl('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!artist.trim()) { setError('Artist name is required.'); return; }
    if (!albumTitle.trim()) { setError('Album title is required.'); return; }

    setIsLoading(true);
    try {
      const response = await addAlbum(table, {
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

      if (!response.success || !response.data) {
        setError(response.error || 'Failed to add the album. Please try again.');
      } else {
        onAlbumAdded(response.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const inputCls =
    'w-full bg-zinc-900 border border-white/5 focus:border-zinc-500 rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-zinc-500/20 text-zinc-150 transition-all placeholder:text-zinc-600 disabled:opacity-50 font-sans';
  const labelCls =
    'text-[10px] font-bold text-zinc-500 uppercase tracking-widest';
  const disabled = isLoading;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Add New Album</h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">
              Adding to {table === 'albums' ? 'Main Library' : 'Unsorted queue'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-900 border border-white/5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg p-3.5">
              {error}
            </div>
          )}

          {/* Artist */}
          <div className="space-y-1.5">
            <label htmlFor="artist" className={labelCls}>
              Artist <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="artist"
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g., Pink Floyd"
              className={inputCls}
              disabled={disabled}
            />
          </div>

          {/* Album Title */}
          <div className="space-y-1.5">
            <label htmlFor="album_title" className={labelCls}>
              Album Title <span className="text-red-500">*</span>
            </label>
            <input
              id="album_title"
              type="text"
              required
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="e.g., The Dark Side of the Moon"
              className={inputCls}
              disabled={disabled}
            />
          </div>

          {/* Year + Scope */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="year" className={labelCls}>Year</label>
              <input
                id="year"
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 1973"
                className={inputCls}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="scope" className={labelCls}>Scope</label>
              <select
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
                className={inputCls}
                disabled={disabled}
              >
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
            <div className="grid grid-cols-3 gap-2 bg-zinc-950/85 border border-white/5 rounded-lg p-3">
              {([['digital', digital, setDigital], ['cd', cd, setCd], ['vinyl', vinyl, setVinyl]] as const).map(
                ([label, val, setter]: any) => (
                  <label key={label} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-350 cursor-pointer select-none capitalize">
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

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className={labelCls}>Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Early pressings, remaster notes…"
              rows={3}
              className={`${inputCls} resize-none`}
              disabled={disabled}
            />
          </div>

          {/* Cover Art URL (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="cover_url" className={labelCls}>Artwork URL (optional)</label>
            <input
              id="cover_url"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
              className={inputCls}
              disabled={disabled}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-5 bg-zinc-950 border-t border-white/5 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-350 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-55 shadow-md"
          >
            {isLoading ? (
              <><Loader2 className="w-4.5 h-4.5 animate-spin" />Creating…</>
            ) : (
              <><Plus className="w-4 h-4" />Add Album</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
