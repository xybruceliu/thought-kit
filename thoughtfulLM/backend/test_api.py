import asyncio
import httpx
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def test_generate_thought():
    """Test the thought generation endpoint"""
    print("\n🔄 Testing thought generation...")
    
    # Sample request data
    data = {
        "event": {
            "text": "I'm researching the impact of AI on society.",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant.",
                "user_prompt": "Generate a thought about the user's research topic."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 100
        },
        "config": {
            "modality": "TEXT",
            "depth": 2,
            "length": 10,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{BASE_URL}/thoughts/generate", json=data)
            
            if response.status_code == 201:
                result = response.json()
                print("✅ Thought generation successful!")
                print(f"🔹 Thought ID: {result.get('id', 'Not found')}")
                print(f"🔹 Content: {result.get('content', {}).get('text', 'Not found')}")
                return result
            else:
                print(f"❌ Thought generation failed with status {response.status_code}")
                print(f"Error: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

async def test_operate_on_thought(thought):
    """Test the thought operation endpoint"""
    if not thought:
        print("\n⚠️ Skipping operation test as no thought was generated.")
        return None
    
    print("\n🔄 Testing thought operation...")
    
    # Sample request data
    data = {
        "operation": "like",
        "thoughts": [thought],
        "options": {
            "amount": 0.2
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{BASE_URL}/thoughts/operate", json=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Thought operation successful!")
                
                # Handle both single thought and list of thoughts
                if isinstance(result, list):
                    first_thought = result[0]
                else:
                    first_thought = result
                
                print(f"🔹 Updated weight: {first_thought.get('config', {}).get('weight', 'Not found')}")
                return result
            else:
                print(f"❌ Thought operation failed with status {response.status_code}")
                print(f"Error: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

async def test_articulate_thoughts(thought):
    """Test the thought articulation endpoint"""
    if not thought:
        print("\n⚠️ Skipping articulation test as no thought was generated.")
        return None
    
    print("\n🔄 Testing thought articulation...")
    
    # Sample request data
    data = {
        "thoughts": [thought],
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 200
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{BASE_URL}/thoughts/articulate", json=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Thought articulation successful!")
                print(f"🔹 Response: {result.get('response', 'Not found')}")
                return result
            else:
                print(f"❌ Thought articulation failed with status {response.status_code}")
                print(f"Error: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

async def run_tests():
    """Run all tests in sequence"""
    print("🧪 Starting API tests...")
    
    # Test generate
    thought = await test_generate_thought()
    
    # Test operate
    operated_thought = await test_operate_on_thought(thought)
    
    # Test articulate
    await test_articulate_thoughts(thought)
    
    print("\n🏁 Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests()) 