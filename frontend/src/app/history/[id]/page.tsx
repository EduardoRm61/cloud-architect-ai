"use client";

import React, { useEffect, useState } from 'react';
import { getGeneration, GenerationRecord } from '@/lib/api';
import { ResultView } from '@/components/features/ResultView';
import { ExportButtons } from '@/components/features/ExportButtons';
import { Loader2, ArrowLeft, Calendar, Cloud } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function HistoryDetailPage() {
  const { id } = useParams() as { id: string };
  const [generation, setGeneration] = useState<GenerationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getGeneration(id);
        setGeneration(data);
      } catch (err: any) {
        const msg = err.message || 'Erro ao carregar detalhes da arquitetura';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
        <span className="text-slate-500 font-medium">Buscando sua arquitetura nos arquivos...</span>
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4 select-none opacity-60">☁️</div>
        <div className="bg-destructive/10 text-destructive p-8 rounded-xl border border-destructive/20 max-w-lg w-full">
          <h2 className="text-xl font-bold mb-3">Projeto Não Encontrado</h2>
          <p className="text-sm opacity-80 mb-6">{error || 'Não conseguimos localizar este diagrama.'}</p>
          <Link href="/history" className="inline-flex items-center justify-center px-4 py-2 bg-white text-destructive border border-destructive/20 rounded-md font-medium hover:bg-destructive/5 transition">
            Voltar ao Histórico
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/history" className="p-2 -ml-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-full transition-colors shrink-0" title="Voltar ao Histórico">
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 border-r border-slate-200 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 line-clamp-1">{generation.description}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium px-1.5 py-0.5 rounded bg-slate-100 uppercase">
                  <Cloud size={10} /> {generation.provider}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(generation.created_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <ExportButtons result={generation} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <ResultView result={generation} />
      </div>
    </main>
  );
}
