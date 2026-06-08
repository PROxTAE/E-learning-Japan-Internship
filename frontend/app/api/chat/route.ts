import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, prompt, context, contexts, lang } = await req.json();

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
    let systemPrompt = `You are a helpful, smart, and friendly teaching assistant integrated into an E-Learning Web Application. 
Your goal is to support teachers and students with their learning needs, creating quizzes, analyzing data, and answering questions.
Keep your answers clear, concise, and structured.
IMPORTANT: You MUST respond in ${userLanguage} language ONLY. This is critical as the user's active interface language is set to ${userLanguage}.`;

    if (lang === "th") {
      systemPrompt += `\n\nคำชี้แจงพิเศษ: กรุณาตอบผู้ใช้เป็นภาษาไทยตลอดการสนทนา ห้ามใช้ภาษาอังกฤษยกเว้นคำศัพท์เฉพาะทางด้านเทคนิค ตอบด้วยภาษาไทยที่สละสลวย เป็นธรรมชาติ และสะกดถูกต้อง`;
    } else if (lang === "ja") {
      systemPrompt += `\n\n特別指示：必ず日本語で回答してください。専門用語を除き、外国語での回答は避けてください。自然で丁寧な日本語を使用してください。`;
    }

    apiMessages.push({ role: "system", content: systemPrompt });

    // If contexts or context are provided, inject them as system messages to guide the LLM
    if (contexts && Array.isArray(contexts) && contexts.length > 0) {
      apiMessages.push({
        role: "system",
        content: `Current page / elements context details: ${JSON.stringify(contexts)}`
      });
    } else if (context) {
      apiMessages.push({
        role: "system",
        content: `Current page / element context: ${JSON.stringify(context)}`
      });
    }

    // Append history
    if (messages && Array.isArray(messages)) {
      apiMessages = [...apiMessages, ...messages];
    }

    // Append current prompt
    if (prompt) {
      apiMessages.push({ role: "user", content: prompt });
    }

    // Verify we have at least one user or assistant message to process
    if (apiMessages.filter(m => m.role !== "system").length === 0) {
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
        stream: true,
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

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const content = parsed.message?.content || "";
                const model = parsed.model || selectedModel;
                const thinking = parsed.message?.thinking || "";

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ token: content, thinking, model })}\n\n`
                  )
                );
              } catch (e) {
                // Ignore parsing errors for partial lines
              }
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
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
