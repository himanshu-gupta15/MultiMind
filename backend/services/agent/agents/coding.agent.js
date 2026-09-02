import { getModel } from "../config/llmModels.js";
import { checkAgentLimit } from "../config/agentLimit.js";
import { deductCredits } from "../utils/deductCredits.js";

const isCodeGenerationRequest = (prompt = "") => {
  const text = prompt.toLowerCase();

  return [
    "build",
    "create",
    "make",
    "develop",
    "generate",
    "app",
    "website",
    "project",
    "component",
    "ui",
    "frontend",
    "backend",
    "api",
    "react",
    "next",
    "vue",
    "javascript",
    "typescript",
    "html",
    "css"
  ].some(keyword => text.includes(keyword));
};


/**
 * Reusable code-generation prompt
 */
const buildCodeGenerationPrompt = (userRequest) => `
You are Multimind Coding Agent.

Generate a complete, fully functional, pixel-perfect, and modern web application/project based on the user's request.

DEFAULT STACK:
- HTML5 with clean, semantic structure
- CSS3 with modern styling, CSS variables, flexbox/grid layout, and smooth transitions
- JavaScript using pure vanilla ES6+, fully interactive and bug-free
- Use React, Next.js, or Vue only if the user explicitly requests it.

DESIGN & UI GUIDELINES:

1. Layout & Alignment:
- Ensure proper element hierarchy.
- Center the main component or app gracefully in the viewport with clean padding and margin.
- For grids such as calculators, dashboards, keyboards, and galleries, ensure CSS grid columns and rows are strictly defined and aligned.
- Example CSS:
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
- For displays/screens such as calculators, the display should span the entire top row.
- Use:
  grid-column: 1 / -1;
- Use clear previous operand and current operand.
- Right-align numbers.
- Handle overflow using clean truncation.

2. Modern Aesthetics:
- Use a sleek, polished dark or modern glassmorphism palette.
- Use beautiful typography.
- Preferred font:
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
- Create distinct button styles for:
  - Primary actions
  - Operations
  - Numbers
  - Danger/clear actions
- Add hover, active, and focus micro-animations.
- Preferred transition:
  transition: all 0.15s ease;
- Use active scale effects.
- Use rounded corners between 12px and 16px.
- Use subtle shadows such as:
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
- Use clean borders.

3. JavaScript Functionality:
- Implement fully functional and tested logic.
- Include keyboard support where applicable.
- Support all expected features.
- Do not leave placeholders.
- Do not leave missing event handlers.
- Handle common edge cases.

IMAGES:
- If images are needed, use valid Unsplash photo URLs.
- Example:
  https://images.unsplash.com/photo-...
- Never use broken placeholder links.

OUTPUT FORMAT:

Return ONLY valid JSON matching this exact schema:

{
  "files": [
    {
      "name": "index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">...\\n</html>"
    },
    {
      "name": "style.css",
      "content": "/* Modern CSS */\\n..."
    },
    {
      "name": "script.js",
      "content": "// Interactive JavaScript\\n..."
    }
  ]
}

STRICT OUTPUT RULES:
- Output must start with {
- Output must end with }
- Do NOT include Markdown code blocks.
- Do NOT include explanations.
- Do NOT include notes.
- Do NOT include commentary.
- Output must be 100% valid and parseable JSON.
- Escape newlines inside JSON string values as \\n.
- Escape double quotes inside JSON string values.
- Return only the JSON object.

USER REQUEST:

${userRequest}
`;


/**
 * Parse LLM JSON safely with multi-stage repairs and fallbacks
 */
const parseGeneratedCode = (content) => {
  let raw = String(content).trim();
  raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    raw = raw.slice(firstBrace, lastBrace + 1);
  }

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
      return parsed;
    }
  } catch {}

  // 2. Fix unescaped newlines/tabs inside string literals
  try {
    const sanitized = raw.replace(/"content":\s*"([\s\S]*?)"(?=\s*,\s*"|\s*})/g, (match, code) => {
      const escaped = code
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return `"content": "${escaped}"`;
    });
    const parsed = JSON.parse(sanitized);
    if (parsed.files && Array.isArray(parsed.files)) {
      return parsed;
    }
  } catch {}

  // 3. Fallback: regex extraction of file entries
  try {
    const files = [];
    const fileRegex = /"name"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*("(?:\\.|[^"\\])*"|`[\s\S]*?`|"[^"]*")/g;
    let match;
    while ((match = fileRegex.exec(raw)) !== null) {
      const name = match[1];
      let codeStr = match[2];
      try {
        if (codeStr.startsWith('"') && codeStr.endsWith('"')) {
          codeStr = JSON.parse(codeStr);
        }
      } catch {
        codeStr = codeStr.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
      files.push({ name, content: codeStr });
    }

    if (files.length > 0) {
      return { files };
    }
  } catch {}

  // 4. Fallback: Markdown code block extraction
  const htmlMatch = raw.match(/```(?:html)?\n([\s\S]*?)```/i);
  const cssMatch = raw.match(/```(?:css)?\n([\s\S]*?)```/i);
  const jsMatch = raw.match(/```(?:javascript|js)?\n([\s\S]*?)```/i);

  if (htmlMatch || cssMatch || jsMatch) {
    const extracted = [];
    if (htmlMatch) extracted.push({ name: "index.html", content: htmlMatch[1].trim() });
    if (cssMatch) extracted.push({ name: "style.css", content: cssMatch[1].trim() });
    if (jsMatch) extracted.push({ name: "script.js", content: jsMatch[1].trim() });
    return { files: extracted };
  }

  console.error("Failed to parse generated JSON:", raw);
  throw new Error("The coding model returned invalid JSON.");
};




export const codingAgent = async (state) => {
  try {
    await checkAgentLimit(state.userId, "coding");

    const llm = await getModel("coding");


    /*
     * --------------------------------------------------
     * DIRECT CODE GENERATION
     * --------------------------------------------------
     */

    if (isCodeGenerationRequest(state.prompt)) {

      const prompt = buildCodeGenerationPrompt(
        state.prompt
      );

      const res = await llm.invoke(prompt);

      const data = parseGeneratedCode(
        res.content
      );

      await deductCredits(
        state.userId,
        "coding"
      );

      return {
        ...state,

        aiResponse:
          "Code Generated Successfully.",

        artifacts: [
          {
            id: Date.now(),
            type: "Project",
            files: data.files || [],
            title: state.prompt
          }
        ]
      };
    }


    /*
     * --------------------------------------------------
     * INTENT CLASSIFICATION
     * --------------------------------------------------
     */

    const intentLlm = await getModel("intent");

    const intentRes = await intentLlm.invoke(`
You are an intent classifier.

Return ONLY ONE of these values:

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
CONVERSATION
DOCUMENTATION

User Request:
${state.prompt}
`);

    const intent = String(
      intentRes.content
    )
      .trim()
      .toUpperCase();


    /*
     * --------------------------------------------------
     * INTENT-BASED CODE GENERATION
     * --------------------------------------------------
     */

    if (intent === "CODE_GENERATION") {

      const prompt = buildCodeGenerationPrompt(
        state.prompt
      );

      const res = await llm.invoke(prompt);

      const data = parseGeneratedCode(
        res.content
      );

      await deductCredits(
        state.userId,
        "coding"
      );

      return {
        ...state,

        aiResponse:
          "Code Generated Successfully.",

        artifacts: [
          {
            id: Date.now(),
            type: "Project",
            files: data.files || [],
            title: state.prompt
          }
        ]
      };
    }


    /*
     * --------------------------------------------------
     * CODE REVIEW / DEBUGGING / EXPLANATION
     * --------------------------------------------------
     */

    const res = await llm.invoke(`
The user's request is:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code

User Request:

${state.prompt}
`);

    const data = res.content;

    await deductCredits(
      state.userId,
      "coding"
    );

    return {
      ...state,
      aiResponse: data,
      artifacts: []
    };

  } catch (error) {

    console.error(
      "Coding Agent Error:",
      error
    );

    return {
      ...state,

      aiResponse:
        error?.data?.message ||
        `Failed to run coding agent: ${error?.message || error
        }`
    };
  }
};