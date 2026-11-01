
const express = require("express");
const router = express.Router();

const { fetchPage } = require("../services/tinyfish");
const { analyzeComments } = require("../services/gemini");

// Latest successful TinyFish extraction
const SAVED_DEMO_RUN_ID =
    "6741dddb-e7b4-4630-b67f-8fe3d5306148";


// -------------------------------------
// HELPER: Validate YouTube URL
// -------------------------------------

function isValidYouTubeUrl(url) {
    try {
        const parsed = new URL(url);

        const allowedHosts = [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "youtu.be",
            "www.youtube-nocookie.com"
        ];

        return (
            ["http:", "https:"].includes(parsed.protocol) &&
            allowedHosts.includes(parsed.hostname)
        );

    } catch {
        return false;
    }
}


// -------------------------------------
// HELPER: Clean comments
// -------------------------------------

function cleanComments(comments) {
    if (!Array.isArray(comments)) {
        return [];
    }

    return comments.filter(comment =>
        comment &&
        typeof comment.text === "string" &&
        comment.text.trim().length > 0
    );
}


// -------------------------------------
// MAIN API: LIVE ANALYSIS
// TinyFish → Gemini
// -------------------------------------

router.post("/", async (req, res) => {
    try {
        const { url } = req.body || {};

        if (!url) {
            return res.status(400).json({
                success: false,
                error: "Please provide a YouTube URL."
            });
        }

        if (!isValidYouTubeUrl(url)) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid YouTube video URL."
            });
        }

        // STEP 1: TinyFish extraction

        console.log("--------------------------------");
        console.log("CROWDLENS LIVE ANALYSIS");
        console.log("Fetching:", url);
        console.log("Calling TinyFish Agent...");

        const result = await fetchPage(url);

        console.log("TinyFish response received!");

        const comments = cleanComments(result.comments);

        console.log("Comments extracted:", comments.length);

        // STEP 2: Handle extraction failure

        if (comments.length === 0) {
            return res.status(422).json({
                success: false,
                source_mode: "live",
                error:
                    result.extraction_note ||
                    "No comments could be extracted. YouTube may be blocking access.",
                data: {
                    title: result.title,
                    url: result.url,
                    comments_section_found:
                        result.comments_section_found,
                    extraction_note: result.extraction_note,
                    tinyfish_run_id: result.tinyfish_run_id,
                    comments: []
                }
            });
        }

        // STEP 3: Gemini analysis

        console.log("Calling Gemini AI...");

        const aiAnalysis = await analyzeComments(
            comments,
            result.title
        );

        console.log("Gemini analysis received!");

        // STEP 4: Final response

        return res.json({
            success: true,
            source_mode: "live",
            data: {
                title: result.title,
                url: result.url,
                comments,
                comments_count: comments.length,
                comments_section_found:
                    result.comments_section_found,
                extraction_note: result.extraction_note,
                tinyfish_run_id: result.tinyfish_run_id,
                ai_analysis: aiAnalysis
            }
        });

    } catch (error) {
        console.error("Live Analysis Error:", error.message);

        return res.status(500).json({
            success: false,
            source_mode: "live",
            error: error.message ||
                "Something went wrong during analysis."
        });
    }
});


// -------------------------------------
// DEMO API: SAVED TINYFISH EXTRACTION
// No new TinyFish run
// -------------------------------------

router.post("/demo", async (req, res) => {
    try {
        console.log("--------------------------------");
        console.log("CROWDLENS SAVED DEMO");
        console.log("Retrieving saved TinyFish run...");

        const apiKey = process.env.TINYFISH_API_KEY;

        if (!apiKey) {
            throw new Error("TinyFish API key is missing in .env");
        }

        const response = await fetch(
            `https://agent.tinyfish.ai/v1/runs/${SAVED_DEMO_RUN_ID}`,
            {
                method: "GET",
                headers: {
                    "X-API-Key": apiKey
                },
                signal: AbortSignal.timeout(60000)
            }
        );

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(
                payload.error?.message ||
                `Could not retrieve saved run: ${response.status}`
            );
        }

        // Handle possible response nesting
        let savedResult =
            payload.result ||
            payload.data?.result;

        if (typeof savedResult === "string") {
            savedResult = JSON.parse(savedResult);
        }

        if (!savedResult) {
            throw new Error(
                "Saved TinyFish run did not contain an extraction result."
            );
        }

        const comments = cleanComments(
    (savedResult.comments || []).map(comment => ({
        ...comment,
        text: comment.text || comment.comment_text
    }))
);

        if (comments.length === 0) {
            return res.status(422).json({
                success: false,
                source_mode: "saved_demo",
                error: "The saved demo run contains no comments."
            });
        }

        console.log("Saved comments retrieved:", comments.length);
        console.log("Calling Gemini AI...");

        // Analyse the saved real comments again
        const aiAnalysis = await analyzeComments(
            comments,
            savedResult.video_title || "YouTube Video"
        );

        console.log("Demo analysis completed!");

        return res.json({
            success: true,
            source_mode: "saved_demo",
            data: {
                title: savedResult.video_title || "YouTube Video",
                url: savedResult.video_url || savedResult.canonical_url || null,
                comments,
                comments_count: comments.length,
                comments_section_found:
                    savedResult.comments_section_found ?? true,
                extraction_note:
                    savedResult.extraction_note ||
                    "Using a previously completed TinyFish extraction.",
                tinyfish_run_id: SAVED_DEMO_RUN_ID,
                ai_analysis: aiAnalysis
            }
        });

    } catch (error) {
        console.error("Demo Analysis Error:", error.message);

        return res.status(500).json({
            success: false,
            source_mode: "saved_demo",
            error: error.message
        });
    }
});


// -------------------------------------
// GEMINI TEST API
// Does NOT call TinyFish
// -------------------------------------

router.post("/test-gemini", async (req, res) => {
    try {
        console.log("Testing Gemini through backend...");

        const sampleComments = [
            {
                author: "@user1",
                text: "We need a JavaScript tutorial also",
                like_count: "100",
                timestamp: "2 months ago"
            },
            {
                author: "@user2",
                text: "Where is the image link for the Amazon project?",
                like_count: "43",
                timestamp: "1 month ago"
            },
            {
                author: "@user3",
                text: "The explanation is clear and easy to follow. Thank you!",
                like_count: "50",
                timestamp: "1 year ago"
            },
            {
                author: "@user4",
                text: "Flex-wrap and align-items concepts are missing.",
                like_count: "20",
                timestamp: "3 months ago"
            }
        ];

        const aiAnalysis = await analyzeComments(
            sampleComments,
            "CSS Tutorial for Beginners"
        );

        return res.json({
            success: true,
            source_mode: "test",
            message: "Gemini backend integration working!",
            data: {
                comments: sampleComments,
                comments_count: sampleComments.length,
                ai_analysis: aiAnalysis
            }
        });

    } catch (error) {
        console.error("Gemini Test Error:", error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;
