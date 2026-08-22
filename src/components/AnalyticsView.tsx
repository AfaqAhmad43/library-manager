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

  // Sort decades chronologically
  const sortedDecades = Object.entries(decadeCounts).sort(([decA], [decB]) => {
    if (decA === 'Unknown') return 1;
    if (decB === 'Unknown') return -1;
    return decA.localeCompare(decB);
  });

  const maxDecadeCount = Math.max(...Object.values(decadeCounts), 1);

  return (
    <div className="space-y-6 pt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grand Total */}
        <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-xl transition-all duration-350">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Catalog Size</p>
            <p className="text-3xl font-bold text-zinc-100 mt-1.5 tracking-tight font-mono">{grandTotal}</p>
          </div>
          <div className="p-3 bg-zinc-800/40 border border-white/5 rounded-xl text-zinc-400">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Library Count */}
        <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-xl transition-all duration-350">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Library</p>
            <p className="text-3xl font-bold text-zinc-200 mt-1.5 tracking-tight font-mono">
              {libTotal}
            </p>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/15 rounded-xl text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Unsorted Backlog */}
        <div className="bg-zinc-900/30 hover:bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between shadow-xl transition-all duration-350">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unsorted queue</p>
            <p className="text-3xl font-bold text-amber-500 mt-1.5 tracking-tight font-mono">
              {unsortedTotal}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl text-amber-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formats Distribution */}
        <div className="bg-zinc-900/20 border border-white/5 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-white/5">
            <Percent className="w-4 h-4 text-zinc-450" />
            <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Format Coverage (Main Library)</h2>
          </div>

          <div className="space-y-5">
            {/* Digital */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-teal-400" />
                  Digital Holdings
                </span>
                <span className="font-mono text-zinc-300">{digitalCount} / {libTotal} ({digitalPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950/80 border border-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-450 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${digitalPercent}%` }}
                />
              </div>
            </div>

            {/* CD */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Disc className="w-4 h-4 text-violet-400" />
                  Compact Discs (CD)
                </span>
                <span className="font-mono text-zinc-300">{cdCount} / {libTotal} ({cdPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950/80 border border-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-550 to-fuchsia-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${cdPercent}%` }}
                />
              </div>
            </div>

            {/* Vinyl */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Disc className="w-4 h-4 text-amber-400" />
                  Vinyl Records (LPs)
                </span>
                <span className="font-mono text-zinc-300">{vinylCount} / {libTotal} ({vinylPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-950/80 border border-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-450 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${vinylPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scope Distribution */}
        <div className="bg-zinc-900/20 border border-white/5 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-white/5">
            <Layers className="w-4 h-4 text-zinc-450" />
            <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Scope Breakdown</h2>
          </div>

          <div className="space-y-5">
            {scopeStats.map((stat) => (
              <div key={stat.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-400">
                  <span>{stat.name} Scope</span>
                  <span className="font-mono text-zinc-350">{stat.count} ({stat.percent}%)</span>
                </div>
                <div className="w-full bg-zinc-950/80 border border-white/5 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-zinc-300 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decade Distribution */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-3.5 border-b border-white/5">
          <Calendar className="w-4 h-4 text-zinc-450" />
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Release Decade Histogram</h2>
        </div>

        {libTotal === 0 ? (
          <p className="text-xs text-zinc-550 italic text-center py-6">No records archived to analyze release years.</p>
        ) : (
          <div className="space-y-4 pt-1">
            {sortedDecades.map(([decade, count]) => {
              const scalePercent = Math.round((count / maxDecadeCount) * 100);
              const totalPercent = Math.round((count / libTotal) * 100);
              return (
                <div key={decade} className="flex items-center gap-4 text-xs font-medium">
                  <span className="w-14 text-zinc-500 font-mono text-right tracking-tight">{decade}</span>
                  <div className="flex-1 bg-zinc-950/80 border border-white/5 rounded-lg h-6 overflow-hidden relative">
                    <div 
                      className="bg-zinc-800 hover:bg-zinc-750 h-full rounded-lg transition-all duration-500 border-r border-white/5 shadow-inner" 
                      style={{ width: `${scalePercent}%` }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300 font-mono">
                      {count} {count === 1 ? 'album' : 'albums'}
                    </span>
                  </div>
                  <span className="w-12 text-zinc-550 text-right font-mono tracking-tight">{totalPercent}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
