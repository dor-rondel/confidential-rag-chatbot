import 'server-only';

export async function getOllamaHealth() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'ok',
        models: data.models.map((model: any) => model.name),
      };
    }
    return { status: 'error', message: 'Ollama is not responding' };
  } catch (error) {
    return { status: 'error', message: 'Ollama is not reachable' };
  }
}
