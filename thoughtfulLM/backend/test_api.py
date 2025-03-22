"""
ThoughtfulLM Backend API Test Script

This script tests the main API endpoints of the ThoughtfulLM backend.
It has been updated to align with the current implementation of the API
as defined in thought_models.py and thoughts.py.

The script tests the following endpoints:
- /thoughts/generate
- /thoughts/operate
- /thoughts/articulate
- /memories/
"""

import asyncio
import httpx
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def test_generate_thought():
    """Test the thought generation endpoint"""
    print("\n🔄 Testing thought generation...")
    
    # Sample request data - simplified to match the GenerationRequest model
    data = {
        "event_text": "I'm researching the impact of AI on society.",
        "event_type": "WORD_COUNT_CHANGE"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(f"{BASE_URL}/thoughts/generate", json=data)
            
            if response.status_code == 201:
                result = response.json()
                print("✅ Thought generation successful!")
                print(f"🔹 Thought ID: {result.get('id', 'Not found')}")
                print(f"🔹 Content: {result.get('content', {}).get('text', 'Not found')}")
                print(f"🔹 Seed Type: {result.get('seed', {}).get('type', 'Not found')}")
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
    
    # Use the thought directly as returned from the generate endpoint
    # The model now expects a simpler format that matches OperationRequest
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
    
    # Simplified to match the ArticulationRequest model
    # The model and temperature are set in the backend
    data = {
        "thoughts": [thought]
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

async def test_memory_operations():
    """Test the memory endpoints"""
    print("\n🔄 Testing memory operations...")
    
    # Test adding a memory
    print("🔄 Testing add memory...")
    memory_data = {
        "type": "LONG_TERM",
        "text": "The user is researching AI ethics and societal impacts."
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Add memory
            response = await client.post(f"{BASE_URL}/memories/", json=memory_data)
            
            if response.status_code == 201:
                result = response.json()
                print("✅ Memory added successfully!")
                print(f"🔹 Memory ID: {result.get('id', 'Not found')}")
                print(f"🔹 Content: {result.get('content', {}).get('text', 'Not found')}")
                
                # Clear memories
                print("🔄 Testing clear memories...")
                response = await client.delete(f"{BASE_URL}/memories/")
                
                if response.status_code == 204:
                    print("✅ Memories cleared successfully!")
                else:
                    print(f"❌ Failed to clear memories with status {response.status_code}")
                    print(f"Error: {response.text}")
            else:
                print(f"❌ Failed to add memory with status {response.status_code}")
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")

async def run_tests():
    """Run all tests in sequence"""
    print("🧪 Starting API tests...")
    
    # Test generate
    thought = await test_generate_thought()
    
    # Test operate
    operated_thought = await test_operate_on_thought(thought)
    
    # Test articulate
    await test_articulate_thoughts(thought)
    
    # Test memory operations
    await test_memory_operations()
    
    print("\n🏁 Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests()) 