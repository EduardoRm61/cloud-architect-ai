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
  "mermaid_code": "...",
  "cost_estimate": [
    {"service": "...", "monthly_cost_usd": 0.0, "notes": "..."}
  ],
  "total_monthly_cost_usd": "...",
  "alternatives": [
    {"name": "...", "trade_off": "..."}
  ]
}
Make sure the mermaid_code contains a valid Mermaid graph string, starting with 'graph TD' or 'architecture'. DO NOT WRAP THE JSON IN MARKDOWN BLOCKS. Return only the raw JSON.
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
        
        return validated.model_dump()

class GeminiService:
    @staticmethod
    async def generate_architecture(description: str, provider: str, filters: dict = None) -> dict:
        builder = PromptBuilder(description, provider, filters)
        prompt = builder.build()
        
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction="You are an expert cloud solutions architect. Provide strictly structured bare JSON output as requested.")
        response = await model.generate_content_async(prompt)
        
        parser = ResponseParser()
        return parser.parse_and_validate(response.text)
