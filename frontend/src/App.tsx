import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/client';
import { CompForm } from './components/CompForm';
import { ResultCard } from './components/ResultCard';
import { Header } from './components/Header';
import type { CompResult } from './api/client';

function App() {
  const [result, setResult] = useState<CompResult | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-black text-white antialiased">
        <Header />
        <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="grid gap-8">
            <CompForm onResult={setResult} />
            {result && <ResultCard result={result} />}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
