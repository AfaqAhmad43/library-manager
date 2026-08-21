'use client';

import React, { useState } from 'react';
import { Search, Plus, FilterX, HelpCircle, AlertCircle } from 'lucide-react';
import { Album, Scope } from '@/types';
import StatsBar from './StatsBar';
import AlbumCard from './AlbumCard';
import AddAlbumModal from './AddAlbumModal';
import EditAlbumDrawer from './EditAlbumDrawer';

interface LibraryDashboardProps {
  initialAlbums: Album[];
  dbError?: string;
}

type FormatFilter = 'ALL' | 'DIGITAL' | 'CD' | 'VINYL' | 'PHYSICAL' | 'DIGITAL_ONLY';

const FORMAT_PILLS: { key: FormatFilter; label: string }[] = [
  { key: 'ALL',          label: 'All'           },
  { key: 'DIGITAL',      label: 'Digital'        },
  { key: 'CD',           label: 'CD'             },
  { key: 'VINYL',        label: 'Vinyl'          },
  { key: 'PHYSICAL',     label: 'CD / Vinyl'     },
  { key: 'DIGITAL_ONLY', label: 'Digital Only'   },
];

export default function LibraryDashboard({ initialAlbums, dbError }: LibraryDashboardProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit drawer
  const [drawerAlbum, setDrawerAlbum] = useState<Album | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Filtering ───────────────────────────────────────────────────────────
  const filteredAlbums = albums.filter((album) => {
    const matchesSearch =
      album.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.album_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesScope = selectedScope === 'ALL' || album.scope === selectedScope;

    let matchesFormat = true;
    if      (selectedFormat === 'DIGITAL')      matchesFormat = album.digital;
    else if (selectedFormat === 'CD')           matchesFormat = album.cd;
    else if (selectedFormat === 'VINYL')        matchesFormat = album.vinyl;
    else if (selectedFormat === 'PHYSICAL')     matchesFormat = album.cd || album.vinyl;
    else if (selectedFormat === 'DIGITAL_ONLY') matchesFormat = album.digital && !album.cd && !album.vinyl;

    return matchesSearch && matchesScope && matchesFormat;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAlbumAdded = (newAlbum: Album) =>
    setAlbums((prev) => [newAlbum, ...prev]);

  const handleAlbumUpdated = (updated: Album) =>
    setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedScope('ALL');
    setSelectedFormat('ALL');
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedScope !== 'ALL' || selectedFormat !== 'ALL';

  const openDrawer = (album: Album) => {
    setDrawerAlbum(album);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* DB Connection Error Banner */}
      {dbError && (
        <div className="bg-amber-950/20 border border-amber-900/40 text-amber-400 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Database Warning</p>
            <p className="mt-1">Failed to connect or query Supabase. Details:</p>
            <code className="block mt-1.5 p-2 bg-zinc-950/70 rounded font-mono text-zinc-300 border border-zinc-850/50 break-all text-xs">
              {dbError}
            </code>
            <p className="mt-2 text-xs text-zinc-500">
              Please check your environment variables in{' '}
              <code className="bg-zinc-950/60 px-1 py-0.5 rounded font-mono text-zinc-400">.env.local</code>{' '}
              (or Vercel settings) and verify that you ran the SQL schema in the Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Audio Library</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage and audit your album formats spreadsheet archive</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded font-bold text-sm flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Album
        </button>
      </div>

      {/* Live Stats Bar */}
      <StatsBar albums={albums} />

      {/* Search + Scope + Format Filters */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-4 space-y-4">
        {/* Row 1: search + scope */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist or album title…"
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded pl-9 pr-4 py-2 text-sm outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-3 py-2 outline-none focus:border-zinc-700 transition-colors"
            >
              <option value="ALL">All Scopes</option>
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
              <option value="Few">Few</option>
              <option value="Single">Single</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                title="Clear all filters"
                className="bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-200 text-zinc-400 px-3 py-2 rounded text-sm flex items-center gap-1.5 transition-colors"
              >
                <FilterX className="w-4 h-4" />
                <span className="hidden sm:inline md:hidden lg:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Format pill quick-filters */}
        <div className="flex flex-wrap gap-2">
          {FORMAT_PILLS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedFormat(key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                selectedFormat === key
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Album Grid */}
      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={() => openDrawer(album)}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800/80 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-zinc-900/10">
          {hasActiveFilters ? (
            <>
              <FilterX className="w-10 h-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">No results found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                No albums match your current filters. Try resetting them.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded text-xs font-semibold border border-zinc-700/50 transition-colors"
              >
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <HelpCircle className="w-10 h-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">Your library is empty</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Add your first album to get started.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Album
              </button>
            </>
          )}
        </div>
      )}

      {/* Add Album Modal */}
      <AddAlbumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlbumAdded={handleAlbumAdded}
      />

      {/* Edit Album Drawer */}
      <EditAlbumDrawer
        isOpen={isDrawerOpen}
        album={drawerAlbum}
        onClose={() => setIsDrawerOpen(false)}
        onAlbumUpdated={handleAlbumUpdated}
      />
    </div>
  );
}
