'use client';

import React from 'react';
import { Database, Disc, FileAudio, Percent, Layers, BarChart2, Calendar } from 'lucide-react';
import { Album } from '@/types';

interface AnalyticsViewProps {
  libraryAlbums: Album[];
  unsortedAlbums: Album[];
}

export default function AnalyticsView({ libraryAlbums, unsortedAlbums }: AnalyticsViewProps) {
  const libTotal = libraryAlbums.length;
  const unsortedTotal = unsortedAlbums.length;
  const grandTotal = libTotal + unsortedTotal;

  // 1. Format Breakdown (Main Library)
  const digitalCount = libraryAlbums.filter((a) => a.digital).length;
  const cdCount = libraryAlbums.filter((a) => a.cd).length;
  const vinylCount = libraryAlbums.filter((a) => a.vinyl).length;

  const digitalPercent = libTotal ? Math.round((digitalCount / libTotal) * 100) : 0;
  const cdPercent      = libTotal ? Math.round((cdCount / libTotal) * 100) : 0;
  const vinylPercent   = libTotal ? Math.round((vinylCount / libTotal) * 100) : 0;

  // 2. Scope Distribution (Main Library)
  const scopeCounts = libraryAlbums.reduce(
    (acc, a) => {
      const s = a.scope || 'Full';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { Full: 0, Partial: 0, Few: 0, Single: 0 } as Record<string, number>
  );

  const scopeStats = Object.entries(scopeCounts).map(([name, count]) => ({
    name,
    count,
    percent: libTotal ? Math.round((count / libTotal) * 100) : 0,
  }));

  // 3. Decade Distribution (Main Library)
  const decadeCounts = libraryAlbums.reduce((acc, a) => {
    if (!a.year) {
      acc['Unknown'] = (acc['Unknown'] || 0) + 1;
      return acc;
    }
    const match = a.year.match(/\b(19|20)\d{2}\b/);
    if (!match) {
      acc['Unknown'] = (acc['Unknown'] || 0) + 1;
      return acc;
    }
    const year = parseInt(match[0], 10);
    const decade = `${Math.floor(year / 10) * 10}s`;
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort decades chronologically, putting "Unknown" at the end
  const sortedDecades = Object.entries(decadeCounts).sort(([decA], [decB]) => {
    if (decA === 'Unknown') return 1;
    if (decB === 'Unknown') return -1;
    return decA.localeCompare(decB);
  });

  const maxDecadeCount = Math.max(...Object.values(decadeCounts), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grand Total */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Catalog</p>
            <p className="text-3xl font-bold text-zinc-100 mt-1 tracking-tight">{grandTotal}</p>
          </div>
          <div className="p-3 bg-zinc-800/60 rounded-lg text-zinc-350">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Library Count */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Main Library Size</p>
            <p className="text-3xl font-bold text-violet-500 mt-1 tracking-tight">{libTotal}</p>
          </div>
          <div className="p-3 bg-violet-950/20 border border-violet-900/30 rounded-lg text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Unsorted Backlog */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Unsorted Backlog</p>
            <p className="text-3xl font-bold text-amber-500 mt-1 tracking-tight">{unsortedTotal}</p>
          </div>
          <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formats Distribution Card */}
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
            <Percent className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Format Coverage (Main Library)</h2>
          </div>

          <div className="space-y-4">
            {/* Digital */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5"><FileAudio className="w-3.5 h-3.5 text-teal-500" /> Digital</span>
                <span>{digitalCount} albums ({digitalPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${digitalPercent}%` }}></div>
              </div>
            </div>

            {/* CD */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5"><Disc className="w-3.5 h-3.5 text-violet-500" /> CD</span>
                <span>{cdCount} albums ({cdPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full transition-all duration-500" style={{ width: `${cdPercent}%` }}></div>
              </div>
            </div>

            {/* Vinyl */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5"><Disc className="w-3.5 h-3.5 text-amber-500" /> Vinyl</span>
                <span>{vinylCount} albums ({vinylPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${vinylPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scope Distribution Card */}
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Scope Distribution</h2>
          </div>

          <div className="space-y-4">
            {scopeStats.map((stat) => (
              <div key={stat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-zinc-400">
                  <span>{stat.name}</span>
                  <span>{stat.count} ({stat.percent}%)</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2">
                  <div className="bg-violet-550 h-2 rounded-full transition-all duration-500" style={{ width: `${stat.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decade Distribution Section */}
      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Decade of Release</h2>
        </div>

        {libTotal === 0 ? (
          <p className="text-xs text-zinc-550 italic text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3 pt-2">
            {sortedDecades.map(([decade, count]) => {
              const percent = Math.round((count / maxDecadeCount) * 100);
              const realPercent = Math.round((count / libTotal) * 100);
              return (
                <div key={decade} className="flex items-center gap-4 text-xs font-medium">
                  <span className="w-16 text-zinc-400 font-mono text-right">{decade}</span>
                  <div className="flex-1 bg-zinc-950 rounded-md h-5 overflow-hidden border border-zinc-900/60 relative">
                    <div 
                      className="bg-zinc-800 hover:bg-zinc-750 h-full rounded-md transition-all duration-500 border-r border-zinc-700/30" 
                      style={{ width: `${percent}%` }}
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300">
                      {count} {count === 1 ? 'album' : 'albums'}
                    </span>
                  </div>
                  <span className="w-12 text-zinc-500 text-right font-mono">{realPercent}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
