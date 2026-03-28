"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateArchitecture, GenerateParams } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ResultView } from "./ResultView";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  provider: z.enum(["AWS", "GCP", "Azure"]),
  scale: z.string().optional(),
  availability: z.string().optional(),
  appType: z.string().optional(),
  maxBudget: z.coerce.number().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      provider: "AWS",
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
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao gerar a arquitetura.");
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

          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Provedor Cloud</FormLabel>
                <FormControl>
                  <Tabs defaultValue={field.value} onValueChange={field.onChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="AWS">AWS</TabsTrigger>
                      <TabsTrigger value="GCP">GCP</TabsTrigger>
                      <TabsTrigger value="Azure">Azure</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="single" collapsible className="w-full border rounded-lg px-4 bg-white">
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
                Gerando Arquitetura...
              </>
            ) : (
              "Gerar Arquitetura"
            )}
          </Button>
        </form>
      </Form>

      {/* Exibição temporária do Loading Skeleton e do JSON de resposta (Parte 6 apenas) */}
      {isLoading && (
        <div className="space-y-4 pt-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {result && !isLoading && (
        <ResultView result={result} />
      )}
    </div>
  );
}
