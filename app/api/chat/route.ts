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
          5. Demonstrate specific example x² - 5x

        Example:
        User input: "explain quadratic equation"
        Refined output: "Create an animation explaining the quadratic equation and its solutions. The animation should follow these steps:
        
        1. Start with a title 'Understanding Quadratic Equations' using Text with a nice color gradient and fade it in slowly.
        
        2. Introduce the standard form of the equation using MathTex: ax² + bx + c = 0 with scale=1.5, positioned at the top of the screen.
        
        3. Create three colored coefficients a, b, and c with different colors (RED, GREEN, BLUE) and animate them sliding into position.
        
        4. Show the step-by-step solution process:
           - First, move all terms to one side: ax² + bx + c = 0
           - Then, show the quadratic formula: x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
           - Highlight the discriminant (b²-4ac) and explain its significance for determining the number of roots
        
        5. Create an Axes object and plot a parabola using the function f(x) = ax² + bx + c with initial values a=1, b=0, c=-1.
        
        6. Animate how changing coefficients affects the graph:
           - Change 'a' to show how it affects the width/direction of the parabola (spend 3 seconds)
           - Change 'b' to show how it shifts the parabola horizontally (spend 3 seconds)
           - Change 'c' to show how it shifts the parabola vertically (spend 3 seconds)
        
        7. Demonstrate solving a specific example: x² - 5x + 6 = 0
           - Apply the quadratic formula step by step with calculations appearing on screen
           - Show that x = 2 and x = 3 are solutions
           - Plot these points on the graph and highlight them with circles
        
        8. Conclude by showing three different cases of discriminant:
           - Positive discriminant: two real solutions (e.g., x² - 5x + 6 = 0)
           - Zero discriminant: one real solution (e.g., x² - 4x + 4 = 0) 
           - Negative discriminant: no real solutions (e.g., x² + x + 1 = 0)
           
        Ensure smooth transitions between each step and use consistent color coding throughout. Add appropriate wait times between animations to allow viewers to absorb the information, ensuring the total animation lasts at least 20 seconds."`,
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
