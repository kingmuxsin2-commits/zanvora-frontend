'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface PingResponse {
  status: string;
  timestamp: string;
  database: string;
  redis: string;
}

export default function Home() {
  const [status, setStatus] = useState<PingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PingResponse>('/ping')
      .then((res) => setStatus(res.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Marketplace Frontend</h1>
      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">API Connection Status:</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {status && (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}