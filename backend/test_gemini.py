import asyncio
from services.gemini import GeminiService

async def main():
    print("Testing Gemini Service manually...")
    try:
        result = await GeminiService.generate_architecture(
            description="Um blog simples com banco sql.",
            provider="AWS",
            filters={"high_availability": False}
        )
        print("Success! JSON returned:")
        import json
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
