import { NextResponse } from "next/server";

export async function GET() {
  const ollamaBaseUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
  const configuredModel = process.env.OLLAMA_MODEL || "";

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000), // 2-second timeout
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const modelNames = models.map((m: any) => m.name);
      
      let activeModel = configuredModel;
      if (!activeModel && modelNames.length > 0) {
        activeModel = modelNames[0];
      }
      if (!activeModel) {
        activeModel = "gemma2:9b"; // default fallback
      }

      return NextResponse.json({
        success: true,
        connected: true,
        model: activeModel,
        models: modelNames,
        url: ollamaBaseUrl,
      });
    } else {
      return NextResponse.json({
        success: true,
        connected: false,
        error: `Ollama returned status ${response.status}`,
        url: ollamaBaseUrl,
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      connected: false,
      error: err.message || "Failed to fetch Ollama API",
      url: ollamaBaseUrl,
    });
  }
}
