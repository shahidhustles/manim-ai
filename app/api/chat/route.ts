import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const google = createGoogleGenerativeAI({
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
        // onStepFinish
        prompt: `${prompt}`,
        system: `You are an expert mathematics animator using the manim library. Your task is to refine user prompts into clear, detailed instructions for creating mathematical animations, broken down into sequential frames.

    When users provide simple requests, enhance them with specific manim-friendly terminology, LaTeX notation, and detailed visualization instructions.
    
    A frame in this context represents a distinct visual state or "slide" in the animation - the maximum amount of visual elements and animations that logically belong together in one conceptual step of the explanation. Break down complex animations into 3-5 sequential frames.

Example:
User input: "explain quadratic equation"
Refined output: "Create an animation explaining the quadratic equation ax² + bx + c = 0. Start with the standard form using LaTeX, then visualize the parabola with MathTex and parametric functions. Demonstrate how the coefficients a, b, and c affect the shape by animating transitions between different values. Show the quadratic formula derivation step-by-step with FadeIn and Transform animations. Include a graphical representation of roots using coordinate axes and highlight the discriminant's role in determining the number of solutions."

Frame breakdown: This animation would require 4 frames:
Frame 1: Introduction to standard form with LaTeX notation
Frame 2: Visualization of parabola and coefficient effects
Frame 3: Quadratic formula derivation step-by-step
Frame 4: Graphical representation of roots and discriminant`,
        schema: z.object({
          refinedPrompt: z.string().describe("Refined Prompt"),
          frames: z
            .number()
            .describe(
              "No of frames you think are required to complete the animation for the prompt. (Not more than 5) "
            ),
        }),
      });

      const { refinedPrompt, frames } = refinedPromptObject;
      console.log(
        `✨ Refined prompt successfully. Number of frames: ${frames}`
      );

      try {
        const { object: framePrompts } = await generateObject({
          model: google("gemini-1.5-flash"),
          // TODO : add a tool to RAG,
          schema: z.array(
            z.object({
              prompt: z
                .string()
                .describe(
                  "The prompt required to write the code only for that respective frame."
                ),
            })
          ),
          system: `You are an expert manim animation programmer breaking down complex visualizations into clear, sequential frame instructions. Each frame instruction should use precise manim terminology, LaTeX notation, and specific animation classes.

Focus on technical details that will help the next model generate accurate manim code, including:
- Specific manim objects (Circle, Square, MathTex, Axes, Graph)
- Animation methods (Create, FadeIn, Transform, Write)
- Color specifications (RED, BLUE, color gradients)
- Coordinate positions and transformations
- Camera movements and zooming
- Duration and timing details

Note: A frame in this context represents a distinct visual state or "slide" in the animation - the maximum amount of visual elements and animations that logically belong together in one conceptual step of the explanation. Each frame should contain a complete set of instructions for creating that specific segment of the animation.`,
          prompt: `Break down the following animation into ${frames} sequential frames with specific manim coding instructions for each:

${refinedPrompt}

For example, if creating a quadratic equation animation with 5 frames:

Frame 1: "Create a Title object with 'Quadratic Equation' using TextMobject. Use Write animation to display it at the top of the frame. Below it, create a MathTex object for 'ax^2 + bx + c = 0' with scale=1.5 and use FadeIn animation."

Frame 2: "Create three colored variables using MathTex for coefficients a, b, and c with different colors (RED, GREEN, BLUE). Position them on the left side. On the right side, create an Axes object with a parabola graph using the parametric function x -> a*x**2 + b*x + c with default a=1, b=0, c=0."

Frame 3: "Implement TransformMatchingTex to change coefficient values and show corresponding changes in the parabola shape. Demonstrate a=2, then a=-1 with appropriate animations and ReplacementTransform for the curve."

Frame 4: "Create a MathTex object for the quadratic formula x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} and use FadeIn. Highlight the discriminant part (b^2-4ac) with a different color. Add explanatory text using TextMobject showing how discriminant determines the number of roots."

Frame 5: "Create a NumberPlane and plot three examples of quadratic functions with discriminant > 0, = 0, and < 0. Use different colored dots to mark the roots of each function. Add arrows and annotations explaining each case."`,
        });

        console.log(
          `🖼️ Generated ${framePrompts.length} frame prompts successfully`
        );

        const resLinks: string[] = [];
        const generatePromises = framePrompts.map(async (frame, index) => {
          try {
            console.log(
              `🎬 Processing frame ${index + 1}/${framePrompts.length}`
            );
            const res = await fetch("/api/generate", {
              method: "POST",
              body: JSON.stringify({
                prompt: frame.prompt,
              }),
            });

            if (!res.ok) {
              throw new Error(
                `Failed to generate frame ${index + 1}: ${res.status} ${res.statusText}`
              );
            }

            const data = await res.json();
            console.log(`✅ Frame ${index + 1} processed successfully`);
            return data.url || null;
          } catch (error) {
            console.error(`❌ Error processing frame ${index + 1}:`, error);
            return null;
          }
        });

        const results = await Promise.all(generatePromises);
        results.forEach((url) => {
          if (url) resLinks.push(url);
        });

        console.log(`🔗 Generated ${resLinks.length} video links`);
        return NextResponse.json({ links: resLinks });
      } catch (frameError) {
        console.error("❌ Error generating frame prompts:", frameError);
        return NextResponse.json(
          { error: "Failed to generate frame prompts" },
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
