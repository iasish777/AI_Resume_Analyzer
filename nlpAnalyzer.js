/**
 * nlpAnalyzer.js
 * A basic NLP module for extracting skills/keywords from resume text.
 * This is classical NLP (not an LLM call): tokenization, normalization,
 * stopword removal, and keyword matching against a skills dictionary.
 *
 * Install: npm install natural
 */

const natural = require("natural");
const tokenizer = new natural.WordTokenizer();

// A small skills dictionary — expand this as needed per domain
const SKILLS_DB = [
  "javascript", "typescript", "react", "node.js", "express",
  "python", "sql", "mongodb", "postgresql", "docker", "kubernetes",
  "aws", "git", "rest api", "graphql", "html", "css", "tailwind",
  "next.js", "redux", "zustand", "machine learning", "data analysis",
];

/**
 * Normalize and tokenize raw resume text.
 * Lowercases, strips punctuation, tokenizes into words.
 */
function tokenize(text) {
  const cleaned = text.toLowerCase().replace(/[^\w\s.]/g, " ");
  return tokenizer.tokenize(cleaned);
}

/**
 * Extract skill keywords by matching tokens (and adjacent token pairs,
 * to catch two-word skills like "machine learning") against SKILLS_DB.
 */
function extractSkills(text) {
  const tokens = tokenize(text);
  const found = new Set();

  // Single-word matches
  tokens.forEach((token) => {
    if (SKILLS_DB.includes(token)) found.add(token);
  });

  // Two-word matches (bigrams) — e.g. "machine learning", "rest api"
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (SKILLS_DB.includes(bigram)) found.add(bigram);
  }

  return Array.from(found);
}

/**
 * Simple keyword frequency count (term frequency) — useful for
 * ranking which skills/terms appear most in the resume.
 */
function keywordFrequency(text) {
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach((token) => {
    if (token.length < 3) return; // skip very short/noise tokens
    freq[token] = (freq[token] || 0) + 1;
  });
  return freq;
}

/**
 * Compare resume skills against a target job description's skills,
 * returning matched and missing skills — the core of "ATS scoring."
 */
function matchAgainstJobDescription(resumeText, jobDescriptionText) {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescriptionText);

  const matched = jdSkills.filter((skill) => resumeSkills.includes(skill));
  const missing = jdSkills.filter((skill) => !resumeSkills.includes(skill));

  const score = jdSkills.length
    ? Math.round((matched.length / jdSkills.length) * 100)
    : 0;

  return { matched, missing, score };
}

module.exports = {
  tokenize,
  extractSkills,
  keywordFrequency,
  matchAgainstJobDescription,
};
