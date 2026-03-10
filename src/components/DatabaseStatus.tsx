import { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';
import { DataLoaderService } from '@/services/dataLoaderService';

export function DatabaseStatus() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const dataExists = await DataLoaderService.hasData();
      setHasData(dataExists);
    } catch (error) {
      console.error('Erreur lors de la verification de la base de donnees:', error);
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm text-shine-text-secondary animate-pulse">
        <Database className="w-4 h-4" />
        <span>Verification...</span>
      </div>
    );
  }

  if (hasData === null) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm">
      {hasData ? (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600 font-medium">Base active</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 font-medium">Base vide</span>
        </>
      )}
    </div>
  );
}
