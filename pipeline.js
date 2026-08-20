/**
 * pipeline.js
 * Example of how the three layers connect end-to-end:
 * Multer (upload) -> pdf-parse (extract text) -> nlpAnalyzer (skills/score)
 * -> aiFeedback (LLM-generated suggestions)
 *
 * Install: npm install pdf-parse
 */

const fs = require("fs");
const pdfParse = require("pdf-parse");
const { matchAgainstJobDescription } = require("./nlpAnalyzer");
const { generateFeedback } = require("./aiFeedback");

/**
 * Full pipeline: given an uploaded PDF path and a job description,
 * extract text, run NLP matching, then get AI feedback.
 */
async function analyzeResume(pdfPath, jobDescriptionText) {
  // 1. Extract raw text from the uploaded PDF
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  const resumeText = pdfData.text;

  // 2. Run NLP-based skill matching (fast, deterministic, free)
  const nlpResult = matchAgainstJobDescription(resumeText, jobDescriptionText);

  // 3. Send structured NLP output + raw text to the LLM for feedback
  const aiFeedback = await generateFeedback(resumeText, nlpResult);

  // 4. Return combined result
  return {
    nlpResult,      // matched/missing skills, numeric score
    aiFeedback,      // assessment, suggestions, formatting notes
  };
}

module.exports = { analyzeResume };

// Example usage in an Express route:
//
// const { analyzeResume } = require("./pipeline");
//
// app.post("/api/analyze", upload.single("resume"), async (req, res) => {
//   const jobDescription = req.body.jobDescription;
//   const result = await analyzeResume(req.file.path, jobDescription);
//   res.json(result);
// });
