const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface GenerateFilters {
  scale?: string;
  availability?: string;
  appType?: string;
  maxBudget?: number;
}

export interface GenerateParams {
  description: string;
  provider: string;
  filters?: GenerateFilters;
}

export interface ServiceRecommendation {
  name: string;
  purpose: string;
  justification: string;
}

export interface CostItem {
  service: string;
  monthly_cost_usd: number | string;
  notes: string;
}

export interface AlternativeItem {
  name: string;
  trade_off: string;
}

export interface ArchitectureResult {
  architecture?: {
    description?: string;
    services?: ServiceRecommendation[];
  };
  cost_estimate?: {
    items?: CostItem[];
  };
  total_monthly_cost?: string | number;
  alternatives?: {
    items?: AlternativeItem[];
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface GenerationRecord {
  id: string;
  project_id: string;
  description: string;
  provider: string;
  architecture: any;
  mermaid_code: string;
  cost_estimate: any;
  total_monthly_cost: string;
  alternatives: any;
  created_at: string;
}

export async function createProject(name: string, description?: string) {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create project");
  }
  return response.json();
}

export async function getProjects(): Promise<ProjectRecord[]> {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  
  return response.json();
}

export async function generateArchitecture(params: GenerateParams): Promise<ArchitectureResult> {
  const project = await createProject(
    `Projeto: ${params.provider}`,
    params.description.substring(0, 100) + "..."
  );

  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: project.id,
      description: params.description,
      provider: params.provider,
      filters: params.filters || {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to generate architecture");
  }
  
  return response.json();
}

export async function getGenerations(): Promise<GenerationRecord[]> {
  const response = await fetch(`${API_BASE_URL}/generations/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch history");
  }
  
  return response.json();
}

export async function getGeneration(id: string): Promise<GenerationRecord> {
  const response = await fetch(`${API_BASE_URL}/generations/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch generation details");
  }
  
  return response.json();
}
