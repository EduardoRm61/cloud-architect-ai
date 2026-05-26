"use client";

import React, { useEffect, useState } from "react";
import mermaid from "mermaid";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";

interface MermaidRendererProps {
  code: string;
}

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize with standard theme to avoid invisible text bugs
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
      flowchart: {
        htmlLabels: true,
        padding: 25, // Extensão generosa de box para impedir que as letras toquem/cortem na borda
      }
    });

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setHasError(null);
        
        // Clean markdown backticks if accidentally passed
        let cleanCode = code.trim();
        if (cleanCode.startsWith("```mermaid")) cleanCode = cleanCode.replace("```mermaid", "");
        if (cleanCode.startsWith("```")) cleanCode = cleanCode.replace("```", "");
        if (cleanCode.endsWith("```")) cleanCode = cleanCode.substring(0, cleanCode.length - 3);
        cleanCode = cleanCode.trim();

        // Limpar HTML Entities que a IA acaba codificando sem querer
        cleanCode = cleanCode.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        let { svg } = await mermaid.render(id, cleanCode);
        
        // Mermaid v11 não lança exceção em sintaxe inválida — retorna um SVG de erro
        // com o texto "Syntax error in text" renderizado (com emoji de bomba).
        // Checamos a frase completa; a palavra isolada "Syntax error" aparece em CSS
        // de todas as renders bem-sucedidas, então não podemos usar só ela.
        if (
          svg.includes("Syntax error in text") ||
          svg.includes(">Syntax error<") ||
          svg.includes("Parse error")
        ) {
          throw new Error("Diagrama com sintaxe inválida gerado pela IA.");
        }
        
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (error: any) {
        console.error("Mermaid syntax error:", error);
        if (isMounted) {
          setHasError(error?.message || "Erro desconhecido ao desenhar diagrama.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    let timeoutId: NodeJS.Timeout;
    if (code && typeof document !== "undefined") {
      // Pequeno delay para evitar colisões mortais por renderização dupla simultânea 
      // gerada pelo StrictMode do Next.js (que corrompe o D3 do Mermaid).
      timeoutId = setTimeout(() => {
        if (isMounted) renderDiagram();
      }, 50);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [code]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-muted/20 border border-dashed rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-2" />
        <span className="text-secondary-foreground text-sm font-medium">Renderizando o diagrama da arquitetura...</span>
      </div>
    );
  }

  if (hasError) {
    let cleanCode = code.trim();
    if (cleanCode.startsWith("```mermaid")) cleanCode = cleanCode.replace("```mermaid", "");
    if (cleanCode.startsWith("```")) cleanCode = cleanCode.replace("```", "");
    if (cleanCode.endsWith("```")) cleanCode = cleanCode.substring(0, cleanCode.length - 3);
    cleanCode = cleanCode.trim();

    return (
      <div className="w-full flex flex-col items-center justify-center bg-destructive/5 border border-destructive/20 text-destructive rounded-xl p-6">
        <p className="font-semibold mb-2">Erro Nativo do Mermaid:</p>
        <p className="text-sm font-mono bg-destructive/10 p-2 rounded mb-4 max-w-full overflow-x-auto">{hasError}</p>
        <p className="text-sm opacity-80 mb-2">O código bruto gerado foi:</p>
        <pre className="bg-[#1E1E2E] text-[#6DD4B0] p-4 rounded-md w-full overflow-x-auto text-xs text-left">
          {cleanCode}
        </pre>
      </div>
    );
  }

  const renderSvg = () => (
    svgContent && (
      <>
        <style>{`
          .mermaid-wrapper svg {
            width: 100% !important;
            min-width: 900px !important;
            height: auto !important;
            max-width: none !important;
          }
          .fullscreen-mode .mermaid-wrapper svg {
            min-width: 1400px !important;
          }
        `}</style>
        <div 
          className={`mermaid-wrapper mx-auto w-max px-4 ${isFullscreen ? 'fullscreen-mode' : ''}`}
          dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
      </>
    )
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col overflow-auto animate-in fade-in duration-200">
        <div className="sticky top-0 right-0 w-full flex justify-end p-6 pointer-events-none">
          <button 
            onClick={() => setIsFullscreen(false)} 
            className="pointer-events-auto bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <Minimize2 className="w-5 h-5" />
            <span className="font-medium pr-1">Fechar Lupa</span>
          </button>
        </div>
        <div className="flex-1 w-full overflow-auto p-4 md:p-10 pb-20">
          {renderSvg()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white rounded-xl shadow-sm border p-4 md:p-8 overflow-hidden group">
      <button 
        onClick={() => setIsFullscreen(true)} 
        className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 hover:bg-primary/20 z-10"
        title="Ampliar diagrama"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="text-sm font-semibold">Ampliar</span>
      </button>
      
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {renderSvg()}
      </div>
    </div>
  );
}
