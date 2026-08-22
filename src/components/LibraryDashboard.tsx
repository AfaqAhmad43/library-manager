'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, FilterX, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Album, Scope } from '@/types';
import { getAlbums } from '@/app/actions';
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

export default function LibraryDashboard({ initialAlbums, dbError: initialDbError }: LibraryDashboardProps) {
  // Table Switcher state
  const [activeTable, setActiveTable] = useState<'albums' | 'unsorted'>('albums');
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [loadingData, setLoadingData] = useState(false);
  const [dbError, setDbError] = useState<string | undefined>(initialDbError);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('ALL');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('artist'); // artist | title | year

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 36; // Divisible by 1, 2, 3, 4, 6 columns

  // Modals / Drawers state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerAlbum, setDrawerAlbum] = useState<Album | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Skip dynamic fetching on initial mount for 'albums' (already server-rendered)
  const isFirstMount = useRef(true);

  // Fetch table data dynamically on table switcher change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const loadTableData = async () => {
      setLoadingData(true);
      setDbError(undefined);
      try {
        const res = await getAlbums(activeTable);
        if (res.success) {
          setAlbums(res.data);
        } else {
          setDbError(res.error || `Failed to fetch data for ${activeTable}`);
        }
      } catch (err: any) {
        setDbError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoadingData(false);
      }
    };

    loadTableData();
  }, [activeTable]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedScope, selectedFormat, sortBy, activeTable]);

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

  // ── Sorting ─────────────────────────────────────────────────────────────
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    if (sortBy === 'title') {
      return a.album_title.localeCompare(b.album_title, undefined, { sensitivity: 'base', numeric: true });
    }
    if (sortBy === 'year') {
      if (!a.year) return 1;
      if (!b.year) return -1;
      return a.year.localeCompare(b.year, undefined, { numeric: true });
    }
    // Default: Sort by Artist (Alphabetical)
    const artistCompare = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
    if (artistCompare !== 0) return artistCompare;
    // Secondary sort by Album Title
    return a.album_title.localeCompare(b.album_title, undefined, { sensitivity: 'base' });
  });

  // ── Pagination calculations ─────────────────────────────────────────────
  const totalPages = Math.ceil(sortedAlbums.length / pageSize);
  const paginatedAlbums = sortedAlbums.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAlbumAdded = (newAlbum: Album) => {
    setAlbums((prev) => [newAlbum, ...prev]);
  };

  const handleAlbumUpdated = (updated: Album) => {
    setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAlbumMoved = (albumId: string) => {
    // If we are currently in Unsorted, remove it dynamically on move
    if (activeTable === 'unsorted') {
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedScope('ALL');
    setSelectedFormat('ALL');
    setSortBy('artist');
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedScope !== 'ALL' || selectedFormat !== 'ALL' || sortBy !== 'artist';

  const openDrawer = (album: Album) => {
    setDrawerAlbum(album);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Header and Add Button */}
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

      {/* Table Switcher Tabs */}
      <div className="flex border-b border-zinc-800/80 -mb-px">
        <button
          onClick={() => setActiveTable('albums')}
          disabled={loadingData}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTable === 'albums'
              ? 'border-zinc-150 text-zinc-150'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Main Library
        </button>
        <button
          onClick={() => setActiveTable('unsorted')}
          disabled={loadingData}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTable === 'unsorted'
              ? 'border-zinc-150 text-zinc-150'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Unsorted List
        </button>
      </div>

      {/* Live Stats Bar */}
      <StatsBar albums={albums} />

      {/* Search + Scope + Format + Sort Filters */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-4 space-y-4">
        {/* Row 1: Search + Scope + Sort dropdowns */}
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
            {/* Sorting Select Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-44 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded px-3 py-2 outline-none focus:border-zinc-700 transition-colors"
            >
              <option value="artist">Sort by Artist</option>
              <option value="title">Sort by Title</option>
              <option value="year">Sort by Year</option>
            </select>

            {/* Scope Filter */}
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

      {/* Album Grid / Loader */}
      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500">Loading {activeTable === 'albums' ? 'Library' : 'Unsorted'} items...</p>
        </div>
      ) : paginatedAlbums.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                table={activeTable}
                onClick={() => openDrawer(album)}
              />
            ))}
          </div>

          {/* Pagination Navigation Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-900 mt-8 text-sm">
              <span className="text-zinc-500">
                Showing <span className="font-semibold text-zinc-300">{Math.min(sortedAlbums.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                <span className="font-semibold text-zinc-300">{Math.min(sortedAlbums.length, currentPage * pageSize)}</span> of{' '}
                <span className="font-semibold text-zinc-300">{sortedAlbums.length}</span> albums
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-350 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    // Window page selection for long pagination list
                    if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                      if (p === 2 || p === totalPages - 1) {
                        return <span key={p} className="px-1 text-zinc-650 font-bold">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded font-mono text-xs ${
                          currentPage === p
                            ? 'bg-zinc-100 text-zinc-950 font-bold'
                            : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-850'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-350 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-zinc-800/80 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-zinc-900/10">
          {hasActiveFilters ? (
            <>
              <FilterX className="w-10 h-10 text-zinc-650 mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">No results found</h3>
              <p className="text-xs text-zinc-550 mt-1 max-w-sm">
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
              <HelpCircle className="w-10 h-10 text-zinc-650 mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">Your {activeTable === 'albums' ? 'library' : 'unsorted backlog'} is empty</h3>
              <p className="text-xs text-zinc-550 mt-1 max-w-xs">
                Add your first album to this table to get started.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to {activeTable === 'albums' ? 'Library' : 'Unsorted'}
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
        table={activeTable}
      />

      {/* Edit Album Drawer */}
      <EditAlbumDrawer
        isOpen={isDrawerOpen}
        album={drawerAlbum}
        table={activeTable}
        onClose={() => setIsDrawerOpen(false)}
        onAlbumUpdated={handleAlbumUpdated}
        onAlbumMoved={handleAlbumMoved}
      />
    </div>
  );
}
