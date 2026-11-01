require("dotenv").config();

const { analyzeComments } = require("./services/gemini");

async function testPipeline() {
    try {
        console.log("\n=== CROWDLENS REAL-DATA PIPELINE TEST ===\n");

        const runId = "0322516a-45aa-4fb6-9c8c-cb7b5d9d1ebd";

        const response = await fetch(
            `https://agent.tinyfish.ai/v1/runs/${runId}`,
            {
                headers: {
                    "X-API-Key": process.env.TINYFISH_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`TinyFish retrieval failed: ${response.status}`);
        }

        const data = await response.json();
        const result = data.result;

        if (!result || !Array.isArray(result.comments)) {
            throw new Error("No valid comments found in saved run");
        }

        const comments = result.comments;

        console.log("Real TinyFish comments:", comments.length);
        console.log("Video:", result.video_title || "CSS Tutorial");
        console.log("\nSending real comments to Gemini...\n");

        const analysis = await analyzeComments(
            comments,
            result.video_title || "CSS Tutorial for Beginners"
        );

        console.log("GEMINI ANALYSIS SUCCESS!\n");
        console.log(JSON.stringify(analysis, null, 2));

    } catch (error) {
        console.error("\nPIPELINE TEST FAILED:", error.message);
    }
}

testPipeline();