import { getModel } from "../config/llmModels.js";
import axios from "axios";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const visionAgent = async (state) => {
    await checkAgentLimit(state.userId, "image");
    try {
        const llm = await getModel("image");
        const res = await llm.invoke(`You are an elite AI image prompt engineer.

Convert the user request into a highly detailed, vivid image generation prompt.

Requirements:
- Cinematic lighting
- Professional composition
- Ultra realistic, 8K quality, sharp focus
- Beautiful color palette and depth of field
- No explanations, no labels, no quotes
- Return ONLY the enhanced image prompt.

User Request:
${state.prompt}`);

        const prompt = (res?.content || state.prompt).trim().replace(/^["']|["']$/g, "");
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;

        const imageRes = await axios.get(imageUrl, { 
            responseType: "arraybuffer",
            timeout: 60000 
        });

        await deductCredits(state.userId, "vision");
        const buffer = Buffer.from(imageRes.data);
        const filename = `image/${Date.now()}.png`;

        let downloadUrl = "";
        try {
            if (process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
                await uploadToS3(filename, buffer, "image/png");
                downloadUrl = await getFromS3(filename, 24 * 60 * 60);
            }
        } catch (s3Error) {
            console.warn("S3 upload failed for vision, falling back to data URL:", s3Error?.message);
        }

        if (!downloadUrl) {
            const base64 = buffer.toString("base64");
            downloadUrl = `data:image/png;base64,${base64}`;
        }

        return {
            ...state,
            images: [downloadUrl],
            aiResponse: `Here is the image generated for: **${state.prompt}**\n\n![Generated Image](${downloadUrl})\n\n[Download Image](${downloadUrl})`
        };

    } catch (error) {
        console.error("Vision Agent Error:", error);
        return {
            ...state,
            aiResponse: error?.data?.message || `Failed to generate image: ${error.message || error}`
        };
    }
};
