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

export async function generateArchitecture(params: GenerateParams) {
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
