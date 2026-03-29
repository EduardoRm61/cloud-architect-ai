import asyncio
from database import async_session
import models
from services.gemini import GeminiService

async def main():
    async with async_session() as db:
        print("Creating project...")
        proj = models.Project(name="Test Postgres", description="Test")
        db.add(proj)
        await db.commit()
        await db.refresh(proj)
        print(f"Project ID: {proj.id}")

        print("Generating Architecture...")
        parsed_result = await GeminiService.generate_architecture(
            description="Um app em nuvem simples", provider="AWS", filters={}
        )

        try:
            print("Saving Generation...")
            gen = models.Generation(
                project_id=proj.id,
                description="Um app em nuvem simples",
                provider="AWS",
                architecture=parsed_result["architecture"],
                mermaid_code=parsed_result["mermaid_code"],
                cost_estimate={"items": parsed_result["cost_estimate"]},
                total_monthly_cost=str(parsed_result["total_monthly_cost_usd"]),
                alternatives={"items": parsed_result["alternatives"]}
            )
            db.add(gen)
            await db.commit()
            print("DB SAVE SUCCESS!")
        except Exception as e:
            print(f"DB SAVE FAILED: {repr(e)}")

asyncio.run(main())
