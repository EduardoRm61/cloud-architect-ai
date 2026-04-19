import os
from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(ProjectCreate):
    id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class GenerationRequest(BaseModel):
    project_id: UUID
    description: str
    provider: str
    filters: Optional[dict] = None

class CompareRequest(BaseModel):
    description: str
    filters: Optional[dict] = None

class GenerationResponse(BaseModel):
    id: UUID
    project_id: UUID
    description: str
    provider: str
    architecture: dict
    mermaid_code: str
    cost_estimate: dict
    total_monthly_cost: str
    alternatives: dict
    created_at: datetime
    class Config:
        from_attributes = True

# --- Gemini API Structured Outputs Schemas ---
class ArchitectureServiceSchema(BaseModel):
    name: str
    purpose: str
    justification: str

class ArchitectureSchema(BaseModel):
    description: str
    services: List[ArchitectureServiceSchema]

class CostEstimateItemSchema(BaseModel):
    service: str
    monthly_cost_usd: float
    notes: str

class AlternativeSchema(BaseModel):
    name: str
    trade_off: str

class MermaidNodeSchema(BaseModel):
    id: str
    label: str

class MermaidEdgeSchema(BaseModel):
    from_node: str
    to_node: str
    label: str

class DiagramDefinitionSchema(BaseModel):
    nodes: List[MermaidNodeSchema]
    edges: List[MermaidEdgeSchema]

class GeminiOutputSchema(BaseModel):
    architecture: ArchitectureSchema
    mermaid_diagram: DiagramDefinitionSchema
    cost_estimate: List[CostEstimateItemSchema]
    total_monthly_cost_usd: str
    alternatives: List[AlternativeSchema]
