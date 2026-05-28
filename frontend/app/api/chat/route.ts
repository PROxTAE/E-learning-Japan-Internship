import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, prompt, context, lang } = await req.json();

    // 1. Determine which Ollama model to use
    // We try to auto-detect installed models from the local Ollama server.
    const ollamaBaseUrl = process.env.OLLAMA_HOST || "http://localhost:11434";
    let selectedModel = process.env.OLLAMA_MODEL || "";

    if (!selectedModel) {
      try {
        const tagsResponse = await fetch(`${ollamaBaseUrl}/api/tags`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // Short timeout to avoid hanging if Ollama is not running
          signal: AbortSignal.timeout(2000),
        });

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          if (tagsData.models && tagsData.models.length > 0) {
            // Sort models or just pick the first available one
            selectedModel = tagsData.models[0].name;
            console.log(`Auto-detected local Ollama model: ${selectedModel}`);
          }
        }
      } catch (err) {
        console.warn("Failed to contact local Ollama for auto-detection. Is Ollama running?", err);
      }
    }

    // Default fallback model if none could be auto-detected or configured
    if (!selectedModel) {
      selectedModel = "gemma2:9b"; // Popular default model
    }

    // 2. Prepare conversation messages
    let apiMessages = [];

    // Map system language to full language name
    const userLanguage = lang === "th" ? "Thai" : lang === "ja" ? "Japanese" : "English";

    // System instruction for the assistant
    const systemPrompt = `You are a helpful, smart, and friendly teaching assistant integrated into an E-Learning Web Application. 
Your goal is to support teachers and students with their learning needs, creating quizzes, analyzing data, and answering questions.
Keep your answers clear, concise, and structured.
IMPORTANT: You MUST respond in ${userLanguage} language ONLY. This is critical as the user's active interface language is set to ${userLanguage}.`;

    apiMessages.push({ role: "system", content: systemPrompt });

    // If context is provided, inject it as a system message to guide the LLM
    if (context) {
      apiMessages.push({
        role: "system",
        content: `Current page / element context: ${JSON.stringify(context)}`
      });
    }

    // Append history or single prompt
    if (messages && Array.isArray(messages)) {
      apiMessages = [...apiMessages, ...messages];
    } else if (prompt) {
      apiMessages.push({ role: "user", content: prompt });
    } else {
      return NextResponse.json({ error: "Missing prompt or messages" }, { status: 400 });
    }

    // 3. Request Ollama chat endpoint
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Ollama server returned error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.message?.content || "";

    return NextResponse.json({
      message: assistantMessage,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error("Error in Next.js /api/chat route handler:", error);
    return NextResponse.json(
      {
        error: "Could not connect to Ollama. Please check if Ollama is running (`ollama serve`) and has a model installed.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
