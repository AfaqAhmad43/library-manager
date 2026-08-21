import React from 'react';
import LibraryDashboard from '@/components/LibraryDashboard';
import { getAlbums } from './actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const result = await getAlbums();

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <LibraryDashboard
        initialAlbums={result.data || []}
        dbError={result.success ? undefined : (result.error || 'Failed to connect to Supabase')}
      />
    </main>
  );
}
