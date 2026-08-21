'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { updateAlbum } from '@/app/actions';
import { Album, Scope } from '@/types';

interface EditAlbumDrawerProps {
  isOpen: boolean;
  album: Album | null;
  onClose: () => void;
  onAlbumUpdated: (updatedAlbum: Album) => void;
}

export default function EditAlbumDrawer({ isOpen, album, onClose, onAlbumUpdated }: EditAlbumDrawerProps) {
  const [artist, setArtist] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [year, setYear] = useState('');
  const [scope, setScope] = useState<Scope>('Full');
  const [digital, setDigital] = useState(false);
  const [cd, setCd] = useState(false);
  const [vinyl, setVinyl] = useState(false);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  // Set form fields when album changes
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
      setError(null);
      setSuccess(false);
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!artist.trim()) {
      setError('Artist name is required.');
      return;
    }
    if (!albumTitle.trim()) {
      setError('Album title is required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateAlbum(album.id, {
        artist,
        album_title: albumTitle,
        year,
        scope,
        digital,
        cd,
        vinyl,
        notes,
      });

      if (!response.success || !response.data) {
        setError(response.error || 'Failed to update the album. Please try again.');
      } else {
        setSuccess(true);
        onAlbumUpdated(response.data);
        setTimeout(() => {
          onClose();
        }, 800);
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
    <>
      {/* Self-contained animations */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .drawer-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end drawer-fade-in"
      >
        <div className="bg-zinc-900 border-l border-zinc-800/80 w-full max-w-md h-full flex flex-col relative shadow-2xl drawer-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Album Details</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Edit album metadata and formats</p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
              aria-label="Close drawer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded p-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Album updated successfully!
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="edit-artist" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Artist <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-artist"
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
                disabled={isLoading || success}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-album_title" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Album Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-album_title"
                type="text"
                required
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
                disabled={isLoading || success}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="edit-year" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Year
                </label>
                <input
                  id="edit-year"
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650"
                  disabled={isLoading || success}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-scope" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Scope
                </label>
                <select
                  id="edit-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Scope)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-150 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors"
                  disabled={isLoading || success}
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
                    disabled={isLoading || success}
                  />
                  Digital
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cd}
                    onChange={(e) => setCd(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100"
                    disabled={isLoading || success}
                  />
                  CD
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={vinyl}
                    onChange={(e) => setVinyl(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-100"
                    disabled={isLoading || success}
                  />
                  Vinyl
                </label>
              </div>
            </div>

            {/* Notes Area */}
            <div className="space-y-1">
              <label htmlFor="edit-notes" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter mastering source, comments, or details..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded p-2.5 text-sm outline-none focus:border-zinc-650 transition-colors placeholder:text-zinc-650 resize-none font-sans"
                disabled={isLoading || success}
              />
            </div>
          </form>

          {/* Footer Action Buttons */}
          <div className="p-6 border-t border-zinc-850 bg-zinc-900/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-150 py-2.5 px-4 rounded font-semibold text-sm transition-colors"
              disabled={isLoading || success}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-55"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
