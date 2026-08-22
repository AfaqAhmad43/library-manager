'use client';

import React, { useState, useEffect } from 'react';
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

  // Reset form fields when modal opens or closes
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

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-zinc-900 border border-zinc-800/80 w-full max-w-md rounded-lg shadow-xl overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <h2 className="text-base font-bold text-zinc-100">Add New Album</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded p-3">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="artist" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Artist <span className="text-red-500">*</span>
            </label>
            <input
              id="artist"
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g., Pink Floyd"
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="album_title" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Album Title <span className="text-red-500">*</span>
            </label>
            <input
              id="album_title"
              type="text"
              required
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="e.g., The Dark Side of the Moon"
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="year" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Year
              </label>
              <input
                id="year"
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 1973"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="scope" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Scope
              </label>
              <select
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-150 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors"
                disabled={isLoading}
              >
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
                <option value="Few">Few</option>
                <option value="Single">Single</option>
              </select>
            </div>
          </div>

          {/* Formats Checkboxes */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Format Holdings
            </span>
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 border border-zinc-800 rounded p-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={digital}
                  onChange={(e) => setDigital(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100"
                  disabled={isLoading}
                />
                Digital
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cd}
                  onChange={(e) => setCd(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100"
                  disabled={isLoading}
                />
                CD
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={vinyl}
                  onChange={(e) => setVinyl(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100"
                  disabled={isLoading}
                />
                Vinyl
              </label>
            </div>
          </div>

          {/* Notes Area */}
          <div className="space-y-1">
            <label htmlFor="notes" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter mastering source, comments, or details..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-150 py-2.5 px-4 rounded font-semibold text-sm transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-55"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Album
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
