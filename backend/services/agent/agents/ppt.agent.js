import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";
import { generatePpt } from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const pptAgent = async (state) => {
    await checkAgentLimit(state.userId, "ppt");
    try {
        const llm = await getModel("ppt");
        const prompt = `You are a professional presentation designer.

Return ONLY valid JSON matching this schema:
{
  "title": "Presentation Title",
  "subtitle": "Subtitle or brief summary",
  "slides": [
    {
      "title": "Slide Title",
      "points": [
        "First key bullet point...",
        "Second key bullet point...",
        "Third key bullet point...",
        "Fourth key bullet point..."
      ]
    }
  ]
}

Rules:
- Generate 5-8 comprehensive content slides.
- Each slide should have 3-5 concise, impactful bullet points.
- No markdown wrappers, no commentary, no backticks.
- Return ONLY valid JSON starting with { and ending with }.

Topic / User Request:
${state.prompt}`;

        const res = await llm.invoke(prompt);
        const raw = (res?.content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const data = JSON.parse(raw);
        await deductCredits(state.userId, "ppt");

        const ppt = await generatePpt(data);
        const buffer = await ppt.write({
            outputType: "nodebuffer"
        });

        const contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        const filename = `ppt/${Date.now()}.pptx`;

        let downloadUrl = "";
        try {
            if (process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
                await uploadToS3(filename, buffer, contentType);
                downloadUrl = await getFromS3(filename, 24 * 60 * 60);
            }
        } catch (s3Error) {
            console.warn("S3 upload failed for PPT, falling back to data URL:", s3Error?.message);
        }

        if (!downloadUrl) {
            const base64 = Buffer.isBuffer(buffer) ? buffer.toString("base64") : Buffer.from(buffer).toString("base64");
            downloadUrl = `data:${contentType};base64,${base64}`;
        }

        return {
            ...state,
            aiResponse: `Presentation Generated Successfully.\n\n### 📊 ${data.title}\n${data.subtitle ? `*${data.subtitle}*\n\n` : ""}[Download Presentation (.pptx)](${downloadUrl})`
        };
    } catch (error) {
        console.error("PPT Agent Error:", error);
        return {
            ...state,
            aiResponse: error?.data?.message || `Failed to generate PPT: ${error.message || error}`
        };
    }
};