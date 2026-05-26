"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateArchitecture, compareArchitectures, GenerateParams, CompareParams, ArchitectureResult, CompareArchitectureResult } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ResultView } from "./ResultView";
import { CompareView } from "./CompareView";
import { ExportButtons } from "./ExportButtons";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
const formSchema = z.object({
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  provider: z.enum(["Recomendado", "AWS", "GCP", "Azure"]),
  scale: z.string().optional(),
  availability: z.string().optional(),
  appType: z.string().optional(),
  maxBudget: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [compareResults, setCompareResults] = useState<CompareArchitectureResult[] | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      provider: "Recomendado",
      scale: "",
      availability: "",
      appType: "",
      maxBudget: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true);
      setResult(null);
      setCompareResults(null);

      if (isComparing) {
        const params: CompareParams = {
          description: data.description,
          filters: {
            scale: data.scale || undefined,
            availability: data.availability || undefined,
            appType: data.appType || undefined,
            maxBudget: data.maxBudget === "" ? undefined : Number(data.maxBudget),
          },
        };
        const res = await compareArchitectures(params);
        setCompareResults(res);
        toast.success("Comparação gerada com sucesso!");
      } else {
        const params: GenerateParams = {
          description: data.description,
          provider: data.provider,
          filters: {
            scale: data.scale || undefined,
            availability: data.availability || undefined,
            appType: data.appType || undefined,
            maxBudget: data.maxBudget === "" ? undefined : Number(data.maxBudget),
          },
        };

        const res = await generateArchitecture(params);
        setResult(res);
        toast.success("Arquitetura gerada com sucesso!");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao gerar a arquitetura.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Mapeamento de Casos de Uso</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Sistema de e-commerce com alto tráfego, carrinho de compras, pagamentos e notificações..."
                    className="min-h-[120px] resize-none bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-3 pt-4 pb-2">
            <button
              type="button"
              role="switch"
              aria-checked={isComparing}
              onClick={() => setIsComparing(!isComparing)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 ${
                isComparing ? "bg-[#7C8CFF]" : "bg-gray-200"
              }`}
            >
              <span className="sr-only">Comparar mode</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isComparing ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <label 
              onClick={() => setIsComparing(!isComparing)}
              className="text-base font-medium cursor-pointer text-gray-700 select-none"
            >
              Comparar todos os providers simultaneamente
            </label>
          </div>

          {!isComparing && (
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Provedor Cloud</FormLabel>
                  <FormControl>
                    <div className="flex w-full border-b border-gray-200">
                      {["Recomendado", "AWS", "GCP", "Azure"].map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => field.onChange(opt)}
                          className={`flex-1 pb-3 pt-2 text-center text-sm font-medium transition-all ${
                            field.value === opt
                              ? "border-b-2 border-[#7C8CFF] text-[#7C8CFF]"
                              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Accordion className="w-full border rounded-lg px-4 bg-white">
            <AccordionItem value="filters" className="border-none">
              <AccordionTrigger className="hover:no-underline text-secondary-foreground font-medium">
                Filtros avançados
              </AccordionTrigger>
              <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-4">
                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escala Esperada</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="high">Alta Disponibilidade</SelectItem>
                          <SelectItem value="mission-critical">Mission-Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Aplicação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="web">Web App</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="pipeline">Data Pipeline</SelectItem>
                          <SelectItem value="microservices">Microsserviços</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento Máximo Mensal (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" disabled={isLoading} className="w-full text-md py-6 bg-primary hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isComparing ? "Comparando Arquiteturas..." : "Gerando Arquitetura..."}
              </>
            ) : (
              isComparing ? "Comparar Arquiteturas..." : "Gerar Arquitetura"
            )}
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="space-y-4 pt-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}

      {!result && !compareResults && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed rounded-2xl bg-slate-50/50 mt-2">
          <div className="text-5xl mb-4 opacity-60 select-none">☁️</div>
          <p className="text-slate-500 text-sm max-w-xs">
            Preencha o formulário acima e clique em <strong>Gerar Arquitetura</strong> para ver seu diagrama aqui.
          </p>
        </div>
      )}

      {result && !isLoading && !isComparing && (
        <>
          <ResultView result={result} />
          <div className="flex justify-end pt-2">
            <ExportButtons result={result} />
          </div>
        </>
      )}

      {compareResults && !isLoading && isComparing && (
        <CompareView results={compareResults} />
      )}
    </div>
  );
}
