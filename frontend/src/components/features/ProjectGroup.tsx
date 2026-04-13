import React, { useState } from 'react';
import Link from 'next/link';
import { GenerationRecord, ProjectRecord } from '@/lib/api';
import { ChevronDown, ChevronRight, Calendar, Cloud, Code } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectGroupProps {
  project: ProjectRecord;
  generations: GenerationRecord[];
}

export function ProjectGroup({ project, generations }: ProjectGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!generations.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="text-sm font-medium text-slate-400">
          {generations.length} {generations.length === 1 ? 'arquitetura' : 'arquiteturas'}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {generations.map((gen) => (
              <Link key={gen.id} href={`/history/${gen.id}`} className="block group">
                <div className="bg-white border rounded-lg p-5 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <Cloud size={14} />
                      {gen.provider.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(gen.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                    {gen.description}
                  </p>
                  
                  <div className="pt-3 border-t mt-auto flex items-center justify-between">
                    <div className="text-xs font-semibold text-emerald-600">
                      Est. Mensal: {gen.total_monthly_cost}
                    </div>
                    <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium flex items-center gap-1">
                      Ver detalhes <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
