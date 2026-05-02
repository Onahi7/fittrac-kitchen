import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env["AI_INTEGRATIONS_ANTHROPIC_API_KEY"] ?? "dummy",
  baseURL: process.env["AI_INTEGRATIONS_ANTHROPIC_BASE_URL"],
});

const SYSTEM_PROMPT = `You are Vitara, an AI health coach for Fittrac Kitchen — Nigeria's leading health-focused food platform. You specialise in:
- Nigerian nutrition and traditional healing foods (Egusi, Moringa, Zobo, Fonio, Uda, Uziza, etc.)
- Managing chronic conditions through diet: hypertension, diabetes, liver disease, weight management, allergies
- Interpreting meal plans and suggesting improvements based on the user's health data
- Exercise, hydration, and holistic wellness advice

Tone: Warm, knowledgeable, encouraging. Use Nigerian food names and cultural context. Be specific and actionable. Keep responses concise — 2-4 paragraphs max. Never diagnose or replace medical advice; always recommend consulting the Fittrac specialist team for serious concerns.

When given health data (weight, calories, water, exercise, conditions), weave it into your response naturally.`;

router.post("/chat", async (req, res) => {
  const { messages, healthContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const systemWithContext = healthContext
    ? `${SYSTEM_PROMPT}\n\nUser health context: ${JSON.stringify(healthContext)}`
    : SYSTEM_PROMPT;

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemWithContext,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "AI error" })}\n\n`);
    res.end();
  }
});

router.post("/recommendations", async (req, res) => {
  const { conditions, recentMeals, weightTrend, todayNutrition } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Based on my health data, give me 3 specific meal recommendations from the Fittrac Kitchen menu and 2 health tips.
Conditions: ${conditions?.join(", ") || "none specified"}
Recent meals: ${recentMeals?.join(", ") || "none logged"}
Weight trend: ${weightTrend || "stable"}
Today's calories: ${todayNutrition?.calories || 0} kcal, Protein: ${todayNutrition?.protein || 0}g, Fiber: ${todayNutrition?.fiber || 0}g

Respond as JSON: { "meals": [{ "name": string, "reason": string, "healthBenefit": string }], "tips": [string] }`
      }],
    });
    const block = message.content[0];
    const text = block.type === "text" ? block.text : "{}";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { meals: [], tips: [] });
    } catch {
      return res.json({ meals: [], tips: [], raw: text });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
