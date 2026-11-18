import os
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.schemas.schemas import OllamaStatusResponse

class OllamaService:
    @staticmethod
    def get_base_url() -> str:
        return settings.OLLAMA_BASE_URL.rstrip("/")

    @classmethod
    async def check_health(cls) -> OllamaStatusResponse:
        base_url = cls.get_base_url()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    active = models[0] if models else None
                    return OllamaStatusResponse(
                        available=True,
                        base_url=base_url,
                        models=models,
                        active_model=active,
                        version="Ollama Local Engine",
                        instructions="Ollama is connected and ready to run local LLM inference."
                    )
        except Exception:
            pass

        return OllamaStatusResponse(
            available=False,
            base_url=base_url,
            models=[],
            active_model=None,
            version=None,
            instructions=(
                "Ollama server is not running on localhost:11434. "
                "To enable local LLM intelligence, install Ollama from https://ollama.com "
                "and execute: 'ollama run llama3.2' or 'ollama run mistral' in your terminal."
            )
        )

    @classmethod
    async def list_models(cls) -> List[str]:
        status = await cls.check_health()
        return status.models

    @classmethod
    async def generate_response(
        cls,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        base_url = cls.get_base_url()
        selected_model = model or settings.OLLAMA_DEFAULT_MODEL
        
        # Check if server is running
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": selected_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": 0.2
                    }
                }
                if system_prompt:
                    payload["system"] = system_prompt
                
                resp = await client.post(f"{base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "success": True,
                        "response": data.get("response", "").strip(),
                        "model": selected_model,
                        "is_local_ollama": True
                    }
                else:
                    return {
                        "success": False,
                        "response": f"Ollama returned error status {resp.status_code}: {resp.text}",
                        "model": selected_model,
                        "is_local_ollama": True
                    }
        except Exception as e:
            return {
                "success": False,
                "response": (
                    f"Local Ollama instance is not reachable at {base_url}. "
                    "Please make sure Ollama is installed and running (`ollama run llama3.2`)."
                ),
                "model": "offline-fallback",
                "is_local_ollama": False
            }

    @classmethod
    async def pull_model(cls, model_name: str) -> Dict[str, Any]:
        base_url = cls.get_base_url()
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(f"{base_url}/api/pull", json={"name": model_name, "stream": False})
                return {"success": resp.status_code == 200, "message": f"Pull command sent for {model_name}"}
        except Exception as e:
            return {"success": False, "message": f"Failed to pull model: {str(e)}"}
