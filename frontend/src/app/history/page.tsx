import React from 'react';
import { HistoryList } from '@/components/features/HistoryList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Voltar para o Início
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b pb-4">Histórico de Arquiteturas</h1>
        <p className="text-slate-500 mt-2">
          Revise, expanda e consulte os diagramas e custos gerados anteriormente.
        </p>
      </div>
      
      <HistoryList />
    </main>
  );
}
