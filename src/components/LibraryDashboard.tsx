'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, FilterX, HelpCircle, AlertCircle, Loader2, ArrowRightLeft, Trash2, CheckSquare } from 'lucide-react';
import { Album, Scope } from '@/types';
import { getAlbums, moveAlbumsToLibrary, deleteUnsortedAlbums, getLibraryBackup } from '@/app/actions';
import StatsBar from './StatsBar';
import AlbumCard from './AlbumCard';
import AddAlbumModal from './AddAlbumModal';
import EditAlbumDrawer from './EditAlbumDrawer';
import AnalyticsView from './AnalyticsView';

interface LibraryDashboardProps {
  initialAlbums: Album[];
  dbError: string | undefined;
}

type FormatFilter = 'ALL' | 'DIGITAL' | 'CD' | 'VINYL' | 'PHYSICAL' | 'DIGITAL_ONLY';
type ActiveTab = 'albums' | 'unsorted' | 'analytics';

const FORMAT_PILLS: { key: FormatFilter; label: string }[] = [
  { key: 'ALL',          label: 'All'           },
  { key: 'DIGITAL',      label: 'Digital'        },
  { key: 'CD',           label: 'CD'             },
  { key: 'VINYL',        label: 'Vinyl'          },
  { key: 'PHYSICAL',     label: 'CD / Vinyl'     },
  { key: 'DIGITAL_ONLY', label: 'Digital Only'   },
];

export default function LibraryDashboard({ initialAlbums, dbError: initialDbError }: LibraryDashboardProps) {
  // Navigation / Table state
  const [activeTab, setActiveTab] = useState<ActiveTab>('albums');
  const [libraryAlbums, setLibraryAlbums] = useState<Album[]>(initialAlbums);
  const [unsortedAlbums, setUnsortedAlbums] = useState<Album[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [dbError, setDbError] = useState<string | undefined>(initialDbError);
  const [retryCount, setRetryCount] = useState(0); // trigger manual re-fetch

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('ALL');
  const [sortBy, setSortBy] = useState<string>('artist');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 36;

  // Batch Selection state (Unsorted view only)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals / Drawers state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerAlbum, setDrawerAlbum] = useState<Album | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Focus ref for search shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guard: track whether we have hydrated from localStorage yet.
  // This prevents the write-effects from firing before the read-effect and
  // overwriting stored values with the in-memory defaults on first mount.
  const hydratedRef = useRef(false);

  // Pre-fetch Unsorted queue in the background on mount (re-runs on retryCount)
  useEffect(() => {
    const prefetchUnsorted = async () => {
      try {
        const res = await getAlbums('unsorted');
        if (res.success) {
          setUnsortedAlbums(res.data);
          setDbError(undefined);
        } else {
          setDbError(res.error);
        }
      } catch (err: any) {
        console.error('Failed to prefetch unsorted backlog:', err);
        setDbError(err?.message || 'Network error while loading unsorted queue.');
      }
    };
    prefetchUnsorted();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // ── Hydrate state from localStorage once on mount ──────────────────────
  useEffect(() => {
    try {
      const savedTab    = localStorage.getItem('lib_activeTab');
      const savedSearch = localStorage.getItem('lib_searchQuery');
      const savedScope  = localStorage.getItem('lib_selectedScope');
      const savedFormat = localStorage.getItem('lib_selectedFormat');
      const savedSort   = localStorage.getItem('lib_sortBy');

      if (savedTab    && ['albums','unsorted','analytics'].includes(savedTab)) setActiveTab(savedTab as ActiveTab);
      if (savedSearch) setSearchQuery(savedSearch);
      if (savedScope)  setSelectedScope(savedScope);
      if (savedFormat && ['ALL','DIGITAL','CD','VINYL','PHYSICAL','DIGITAL_ONLY'].includes(savedFormat))
        setSelectedFormat(savedFormat as FormatFilter);
      if (savedSort)   setSortBy(savedSort);
    } catch (e) {
      console.warn('Failed to load storage state:', e);
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  // ── Sync state to localStorage (only after hydration to prevent overwriting) ──
  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem('lib_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem('lib_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem('lib_selectedScope', selectedScope);
  }, [selectedScope]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem('lib_selectedFormat', selectedFormat);
  }, [selectedFormat]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    localStorage.setItem('lib_sortBy', sortBy);
  }, [sortBy]);

  // Reset pagination on filter/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedScope, selectedFormat, sortBy, activeTab]);

  // '/' to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Filtering
  const activeAlbumsList = activeTab === 'albums' ? libraryAlbums : unsortedAlbums;

  const filteredAlbums = activeAlbumsList.filter((album) => {
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

  // Sorting
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    if (sortBy === 'title') {
      return a.album_title.localeCompare(b.album_title, undefined, { sensitivity: 'base', numeric: true });
    }
    if (sortBy === 'year') {
      if (!a.year) return 1;
      if (!b.year) return -1;
      return a.year.localeCompare(b.year, undefined, { numeric: true });
    }
    const artistCompare = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
    if (artistCompare !== 0) return artistCompare;
    return a.album_title.localeCompare(b.album_title, undefined, { sensitivity: 'base' });
  });

  // Pagination
  const totalPages = Math.ceil(sortedAlbums.length / pageSize);
  const paginatedAlbums = sortedAlbums.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handlers
  const handleAlbumAdded = (newAlbum: Album) => {
    if (activeTab === 'albums') {
      setLibraryAlbums((prev) => [newAlbum, ...prev]);
    } else if (activeTab === 'unsorted') {
      setUnsortedAlbums((prev) => [newAlbum, ...prev]);
    }
  };

  const handleAlbumUpdated = (updated: Album) => {
    if (activeTab === 'albums') {
      setLibraryAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } else if (activeTab === 'unsorted') {
      setUnsortedAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  };

  const handleAlbumMoved = (albumId: string) => {
    const movedRecord = unsortedAlbums.find(a => a.id === albumId);
    setUnsortedAlbums((prev) => prev.filter((a) => a.id !== albumId));
    if (movedRecord) {
      setLibraryAlbums((prev) => [movedRecord, ...prev]);
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

  // Batch Select Handlers
  const handleSelectAlbum = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredAlbums.length > 0 && filteredAlbums.every((a) => selectedIds.includes(a.id));
  
  const handleSelectAllFiltered = () => {
    if (isAllSelected) {
      const filteredIds = filteredAlbums.map((a) => a.id);
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredAlbums.map((a) => a.id);
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleBatchMigrate = async () => {
    if (selectedIds.length === 0) return;

    const selectedBacklog = unsortedAlbums.filter((a) => selectedIds.includes(a.id));
    const duplicates = selectedBacklog.filter((u) =>
      libraryAlbums.some(
        (l) =>
          l.artist.toLowerCase().trim() === u.artist.toLowerCase().trim() &&
          l.album_title.toLowerCase().trim() === u.album_title.toLowerCase().trim()
      )
    );

    if (duplicates.length > 0) {
      const msg =
        `Warning: ${duplicates.length} of the selected albums already exist in your Main Library:\n\n` +
        duplicates.slice(0, 5).map((d) => `• "${d.album_title}" by ${d.artist}`).join('\n') +
        (duplicates.length > 5 ? `\n• and ${duplicates.length - 5} others…` : '') +
        `\n\nMigrate these albums anyway?`;

      if (!window.confirm(msg)) return;
    } else {
      if (!window.confirm(`Migrate all ${selectedIds.length} selected albums to the Main Library?`)) return;
    }

    setLoadingData(true);
    try {
      const res = await moveAlbumsToLibrary(selectedIds);
      if (res.success && res.data) {
        const migratedIds = selectedIds;
        setUnsortedAlbums((prev) => prev.filter((a) => !migratedIds.includes(a.id)));
        setLibraryAlbums((prev) => [...res.data!, ...prev]);
        setSelectedIds([]);
      } else {
        alert('Batch migration failed: ' + (res.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Migration error: ' + e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to permanently delete these ${selectedIds.length} selected backlog items? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoadingData(true);
    try {
      const res = await deleteUnsortedAlbums(selectedIds);
      if (res.success) {
        const deletedIds = selectedIds;
        setUnsortedAlbums((prev) => prev.filter((a) => !deletedIds.includes(a.id)));
        setSelectedIds([]);
      } else {
        alert('Batch delete failed: ' + (res.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Deletion error: ' + e.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Export Backups
  const exportJSON = async () => {
    try {
      const res = await getLibraryBackup();
      if (!res.success) {
        alert('Failed to fetch backup: ' + res.error);
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', `music_library_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (e: any) {
      alert('JSON export error: ' + e.message);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await getLibraryBackup();
      if (!res.success || !res.albums || !res.unsorted) {
        alert('Failed to fetch backup: ' + (res.error || 'Unknown error'));
        return;
      }

      const headers = ['source_table', 'artist', 'album_title', 'year', 'scope', 'digital', 'cd', 'vinyl', 'notes', 'cover_url'];
      const rows = [headers.join(',')];

      const clean = (val: any) => {
        if (val === undefined || val === null) return '';
        let str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          str = `"${str}"`;
        }
        return str;
      };

      const addRows = (list: Album[], label: string) => {
        for (const item of list) {
          const row = [
            clean(label),
            clean(item.artist),
            clean(item.album_title),
            clean(item.year),
            clean(item.scope),
            clean(item.digital),
            clean(item.cd),
            clean(item.vinyl),
            clean(item.notes),
            clean(item.cover_url),
          ];
          rows.push(row.join(','));
        }
      };

      addRows(res.albums, 'albums');
      addRows(res.unsorted, 'unsorted');

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
      const anchor = document.createElement('a');
      anchor.setAttribute('href', csvContent);
      anchor.setAttribute('download', `music_library_backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (e: any) {
      alert('CSV export error: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* DB Connection Error Banner */}
      {dbError && (
        <div className="bg-amber-950/20 border border-amber-900/30 text-amber-400 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-bold">Database Warning</p>
            <p className="mt-1">Failed to connect or query Supabase. Details:</p>
            <code className="block mt-1.5 p-2 bg-zinc-950/70 rounded font-mono text-zinc-300 border border-zinc-800/50 break-all text-xs">
              {dbError}
            </code>
            <p className="mt-2 text-xs text-zinc-500">
              Please check your environment variables and verify your SQL schema and RLS policies.
            </p>
          </div>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="flex-shrink-0 mt-0.5 text-xs bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Floating Glass Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-white/10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-4.5 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          {/* Row 1: Logo/Title + Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">Audio Archive</h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Catalog, filter, and audit music formats</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportJSON}
                className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                title="Download full JSON backup"
              >
                Export JSON
              </button>
              <button
                onClick={exportCSV}
                className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                title="Download full CSV backup"
              >
                Export CSV
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Album
              </button>
            </div>
          </div>

          {/* Row 2: Navigation Switcher Tabs */}
          <div className="flex gap-1.5 -mb-4.5 pt-1 overflow-x-auto scrollbar-none">
            {(['albums', 'unsorted', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIds([]);
                }}
                disabled={loadingData}
                className={`px-4 py-2.5 text-[10px] uppercase font-bold tracking-widest transition-all relative select-none cursor-pointer border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
              >
                {tab === 'albums' ? 'Main Library' : tab === 'unsorted' ? 'Unsorted queue' : 'Analytics & Stats'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Render Analytics View */}
      {activeTab === 'analytics' ? (
        <AnalyticsView libraryAlbums={libraryAlbums} unsortedAlbums={unsortedAlbums} />
      ) : (
        <>
          {/* Live Stats Bar */}
          <StatsBar albums={activeAlbumsList} />

          {/* Search + Sorting + Filters */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-xl p-4.5 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by artist or album title… (Press '/' to focus)"
                  className="w-full bg-zinc-950/80 border border-white/5 focus:border-zinc-550 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-zinc-550/20 text-zinc-100 placeholder:text-zinc-650 transition-all font-sans"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                {/* Sorting Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-44 bg-zinc-950 border border-white/5 focus:border-zinc-500 text-zinc-350 text-sm rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-zinc-550/20 transition-all font-sans"
                >
                  <option value="artist">Sort by Artist</option>
                  <option value="title">Sort by Title</option>
                  <option value="year">Sort by Year</option>
                </select>

                {/* Scope Filter */}
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="w-full sm:w-40 bg-zinc-950 border border-white/5 focus:border-zinc-500 text-zinc-350 text-sm rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-zinc-550/20 transition-all font-sans"
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
                    className="bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 text-zinc-400 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Format pills bar */}
            <div className="flex flex-wrap gap-2">
              {FORMAT_PILLS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedFormat === key
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                      : 'bg-zinc-950 text-zinc-400 border-white/5 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Operations Bar */}
          {activeTab === 'unsorted' && selectedIds.length > 0 && (
            <div className="bg-zinc-900/60 border border-white/5 p-4.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-xl">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                <CheckSquare className="w-4.5 h-4.5 text-zinc-450" />
                <span>Selected <span className="font-bold text-zinc-200 font-mono">{selectedIds.length}</span> albums</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button
                  onClick={handleBatchMigrate}
                  disabled={loadingData}
                  className="flex-1 sm:flex-none bg-violet-650 hover:bg-violet-600 text-white font-bold text-xs uppercase tracking-wider px-4.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Migrate Selected
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={loadingData}
                  className="flex-1 sm:flex-none bg-red-950/20 border border-red-900/30 hover:bg-red-900/30 text-red-400 font-bold text-xs uppercase tracking-wider px-4.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  disabled={loadingData}
                  className="flex-1 sm:flex-none bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Album Grid */}
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3.5">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-650" />
              <p className="text-xs text-zinc-550 uppercase tracking-widest font-bold">Updating Archive List...</p>
            </div>
          ) : paginatedAlbums.length > 0 ? (
            <div className="space-y-6">
              {activeTab === 'unsorted' && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 pl-1.5">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllFiltered}
                    className="w-4 h-4 rounded bg-zinc-950 border-white/10 text-zinc-200 accent-zinc-200 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select all filtered backlog items</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    table={activeTab}
                    onClick={() => openDrawer(album)}
                    isSelected={selectedIds.includes(album.id)}
                    onSelect={activeTab === 'unsorted' ? () => handleSelectAlbum(album.id) : undefined}
                  />
                ))}
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5 mt-8 text-sm">
                  <span className="text-zinc-500 text-xs">
                    Showing <span className="font-semibold text-zinc-350">{Math.min(sortedAlbums.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                    <span className="font-semibold text-zinc-350">{Math.min(sortedAlbums.length, currentPage * pageSize)}</span> of{' '}
                    <span className="font-semibold text-zinc-350">{sortedAlbums.length}</span> albums
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                          if (p === 2 || p === totalPages - 1) {
                            return <span key={p} className="px-1 text-zinc-600 font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-xs ${
                              currentPage === p
                                ? 'bg-zinc-100 text-zinc-950 font-bold'
                                : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5'
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
                      className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl p-16 text-center flex flex-col items-center justify-center bg-zinc-900/10">
              {hasActiveFilters ? (
                <>
                  <FilterX className="w-10 h-10 text-zinc-650 mb-4" />
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No results found</h3>
                  <p className="text-xs text-zinc-550 mt-1.5 max-w-sm leading-relaxed">
                    No albums match your current filters. Try resetting them.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/5 transition-colors"
                  >
                    Reset Filters
                  </button>
                </>
              ) : (
                <>
                  <HelpCircle className="w-10 h-10 text-zinc-650 mb-4" />
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                    Your {activeTab === 'albums' ? 'library' : 'unsorted backlog'} is empty
                  </h3>
                  <p className="text-xs text-zinc-550 mt-1.5 max-w-xs leading-relaxed">
                    Add your first album to this archive list to get started.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-5 bg-zinc-100 hover:bg-white text-zinc-950 px-4.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to {activeTab === 'albums' ? 'Library' : 'Unsorted'}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Album Modal */}
      <AddAlbumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlbumAdded={handleAlbumAdded}
        table={activeTab === 'analytics' ? 'albums' : activeTab}
      />

      {/* Edit Album Drawer */}
      <EditAlbumDrawer
        isOpen={isDrawerOpen}
        album={drawerAlbum}
        table={activeTab === 'analytics' ? 'albums' : activeTab}
        onClose={() => setIsDrawerOpen(false)}
        onAlbumUpdated={handleAlbumUpdated}
        onAlbumMoved={handleAlbumMoved}
      />
    </div>
  );
}
