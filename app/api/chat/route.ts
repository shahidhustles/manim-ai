import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log("🚀 Starting chat processing");
    const { prompt } = await req.json();
    console.log(`📝 Received prompt: "${prompt.substring(0, 50)}..."`);

    try {
      const { object: refinedPromptObject } = await generateObject({
        model: google("gemini-2.0-flash-001"),
        prompt: `${prompt}`,
        system: `As a manim expert, refine user prompts into detailed animation instructions that last 20+ seconds.
          
          Include: manim objects (Circle, MathTex, etc.), animation methods, colors, positions, and camera movements.
          
          Structure step-by-step sequences for easy code generation.
          
          Example transformation:
          "explain quadratic equation" → "Create animation explaining quadratic equations with:
          1. Title 'Understanding Quadratic Equations'
          2. Introduce equation form ax² + bx + c = 0
          3. Show step-by-step solutions with quadratic formula
          4. Plot parabolas with changing coefficients (a, b, c)
          5. Demonstrate specific example x² - 5x + 6 = 0
          6. Show different discriminant cases
          Use smooth transitions and consistent colors throughout."`,
        schema: z.object({
          refinedPrompt: z.string().describe("Refined Prompt"),
        }),
      });

      const { refinedPrompt } = refinedPromptObject;
      console.log(`✨ Refined prompt successfully`);

      try {
        console.log(`🎬 Processing video generation`);
        const res = await fetch("https://manim-ai.vercel.app/api/generate", {
          method: "POST",
          body: JSON.stringify({
            prompt: refinedPrompt,
          }),
        });

        if (!res.ok) {
          throw new Error(
            `Failed to generate video: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log(`✅ Video processed successfully`);

        if (data.url) {
          console.log(
            `🔗 Generated video link: ${data.url.substring(0, 50)}...`
          );
          return NextResponse.json({ link: data.url });
        }

        return NextResponse.json(
          { error: "No video URL returned" },
          { status: 500 }
        );
      } catch (generationError) {
        console.error("❌ Error generating video:", generationError);
        return NextResponse.json(
          { error: "Failed to generate video" },
          { status: 500 }
        );
      }
    } catch (refinementError) {
      console.error("❌ Error refining prompt:", refinementError);
      return NextResponse.json(
        { error: "Failed to refine prompt" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("💥 Fatal error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
