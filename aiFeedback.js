/**
 * aiFeedback.js
 * Sends resume text + NLP-extracted skill data to an LLM to generate
 * human-readable feedback, ATS-style scoring commentary, and suggestions.
 *
 * This is the layer that makes the app "AI-powered" in the LLM sense,
 * distinct from the rule-based NLP module (nlpAnalyzer.js).
 *
 * Install: npm install openai dotenv
 * .env file: OPENAI_API_KEY=sk-...
 */

require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // NEVER hardcode this — always env var
});

/**
 * Build a structured prompt using the resume text and the NLP module's
 * extracted skills/match data. Passing structured NLP output into the
 * prompt (instead of just raw resume text) grounds the LLM's response
 * in facts you already computed, reducing hallucination and making
 * the output more consistent.
 */
function buildPrompt(resumeText, nlpResult) {
  return `
You are an ATS (Applicant Tracking System) resume reviewer.

Resume text:
"""
${resumeText}
"""

Extracted skills (via NLP keyword matching): ${nlpResult.matched?.join(", ") || "N/A"}
Missing skills vs job description: ${nlpResult.missing?.join(", ") || "N/A"}
Computed match score: ${nlpResult.score ?? "N/A"}%

Based on the above, provide:
1. A short overall assessment (2-3 sentences)
2. Three specific, actionable suggestions to improve the resume
3. Any formatting or clarity issues you notice

Respond in JSON with keys: assessment, suggestions (array), formattingNotes.
`;
}

/**
 * Call the LLM with the constructed prompt and return parsed feedback.
 */
async function generateFeedback(resumeText, nlpResult) {
  const prompt = buildPrompt(resumeText, nlpResult);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4, // lower temperature = more consistent, less "creative"
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  try {
    return JSON.parse(raw);
  } catch (err) {
    // Fallback if the model doesn't return valid JSON
    return { assessment: raw, suggestions: [], formattingNotes: "" };
  }
}

module.exports = { generateFeedback };
