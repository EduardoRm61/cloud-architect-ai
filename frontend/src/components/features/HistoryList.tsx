"use client";

import React, { useEffect, useState } from 'react';
import { getGenerations, getProjects, GenerationRecord, ProjectRecord } from '@/lib/api';
import { ProjectGroup } from './ProjectGroup';
import { Loader2, Cloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function HistoryList() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [gens, projs] = await Promise.all([
          getGenerations(),
          getProjects()
        ]);
        setGenerations(gens || []);
        setProjects(projs || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-3 text-slate-500 font-medium">Carregando seus diagramas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
        <p className="font-semibold mb-2">Ops, algo deu errado!</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50 rounded-2xl border border-dashed">
        <div className="text-6xl mb-6 select-none opacity-80">☁️</div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Seu céu está limpo</h3>
        <p className="text-slate-500 max-w-md mb-8">
          Você ainda não desenhou nenhuma arquitetura. Volte para a página inicial e crie seu primeiro diagrama para vê-lo salvo aqui!
        </p>
        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition shadow-md hover:shadow-lg">
          Criar Nova Arquitetura
        </Link>
      </div>
    );
  }

  // Agrupar gerações por projeto
  const generationsByProject: Record<string, GenerationRecord[]> = {};
  generations.forEach(gen => {
    if (!generationsByProject[gen.project_id]) {
      generationsByProject[gen.project_id] = [];
    }
    generationsByProject[gen.project_id].push(gen);
  });

  // Ordenar projetos para mostrar os mais recentes primeiro (assumindo que IDs mais novos gerem chaves depois, ou ordenamos)
  // Como temos created_at em GenerationRecord, podemos ordenar após injetar.
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      {projects.map(project => {
        const projectGens = generationsByProject[project.id];
        if (!projectGens || projectGens.length === 0) return null;
        
        // Sort generations newest first
        projectGens.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return (
          <ProjectGroup 
            key={project.id} 
            project={project} 
            generations={projectGens} 
          />
        );
      })}
    </div>
  );
}
