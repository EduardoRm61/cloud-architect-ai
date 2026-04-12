import json
import google.generativeai as genai
from config import settings
from schemas import GeminiOutputSchema
from pydantic import ValidationError

genai.configure(api_key=settings.gemini_api_key)

class PromptBuilder:
    def __init__(self, description: str, provider: str, filters: dict = None):
        self.description = description
        self.provider = provider
        self.filters = filters or {}
    
    def build(self) -> str:
        prompt = f"Design a cloud architecture on {self.provider} for the following use case:\n"
        prompt += f"Description: {self.description}\n"
        if self.filters:
            prompt += f"Constraints/Filters: {json.dumps(self.filters)}\n"
        
        prompt += """
Please return ONLY a valid JSON object strictly matching this schema:
{
  "architecture": {
    "description": "...",
    "services": [
      {"name": "...", "purpose": "...", "justification": "..."}
    ]
  },
  "mermaid_diagram": {
    "nodes": [
      {"id": "apiGw", "label": "API Gateway"},
      {"id": "db", "label": "PostgreSQL"}
    ],
    "edges": [
      {"from_node": "apiGw", "to_node": "db", "label": "Lê/Escreve dados"}
    ]
  },
  "cost_estimate": [
    {"service": "...", "monthly_cost_usd": 0.0, "notes": "..."}
  ],
  "total_monthly_cost_usd": "...",
  "alternatives": [
    {"name": "...", "trade_off": "..."}
  ]
}
DO NOT RETURN ANY MERMAID CODE STRING. Only return the structured JSON with `mermaid_diagram` containing abstract `nodes` and `edges`. DO NOT WRAP THE JSON IN MARKDOWN BLOCKS. Return only the raw JSON.
"""
        return prompt

class ResponseParser:
    @staticmethod
    def parse_and_validate(raw_response: str) -> dict:
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "", 1)
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "", 1)
        if cleaned.endswith("```"):
            cleaned = cleaned[:cleaned.rfind("```")]
        cleaned = cleaned.strip()

        data = json.loads(cleaned)
        validated = GeminiOutputSchema(**data)
        
        # Engine robusdo: Compilar o Mermaid de maneira estruturada no Backend!
        mermaid_code = "graph TD\n"
        for node in validated.mermaid_diagram.nodes:
            # Prefix with 'n_' to prevent ANY collision with Mermaid reserved words
            safe_id = "n_" + "".join(c for c in node.id if c.isalnum() or c == "_")
            safe_label = node.label.replace('"', '').replace("'", "")
            mermaid_code += f'    {safe_id}["{safe_label}"]\n'
            
        for edge in validated.mermaid_diagram.edges:
            safe_src = "n_" + "".join(c for c in edge.from_node if c.isalnum() or c == "_")
            safe_tgt = "n_" + "".join(c for c in edge.to_node if c.isalnum() or c == "_")
            
            # Remove strict HTML entities that may have leaked, but ALLOW natural punctuation
            clean_label = edge.label.replace('"', "'").replace('<', '').replace('>', '')
            
            # Wrap the edge label in double quotes to force Mermaid parser to treat it as string
            # This completely bypassed the 'PS' parser bug when using parens/slashes!
            mermaid_code += f'    {safe_src} -->|"{clean_label}"| {safe_tgt}\n'

        result = validated.model_dump()
        result["mermaid_code"] = mermaid_code
        del result["mermaid_diagram"]
        
        return result

class GeminiService:
    @staticmethod
    async def generate_architecture(description: str, provider: str, filters: dict = None) -> dict:
        builder = PromptBuilder(description, provider, filters)
        prompt = builder.build()
        
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction="You are an expert cloud solutions architect. Provide strictly structured bare JSON output as requested.")
        response = await model.generate_content_async(prompt)
        
        parser = ResponseParser()
        return parser.parse_and_validate(response.text)
