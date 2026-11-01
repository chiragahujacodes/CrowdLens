
async function fetchPage(url) {
    const apiKey = process.env.TINYFISH_API_KEY;
    const profileId = process.env.TINYFISH_PROFILE_ID;

    if (!apiKey) {
        throw new Error("TinyFish API key is missing in .env");
    }

    if (!profileId) {
        throw new Error("TinyFish profile ID is missing in .env");
    }

    console.log("Starting TinyFish Agent...");
    console.log("Using saved browser profile...");

    const requestBody = {
        url,

        // Runtime browser mode
        browser_profile: "stealth",

        // Reuse saved YouTube login/session
        use_profile: true,
        profile_id: profileId,

        goal: `
You are extracting public YouTube comments for CrowdLens.

Follow these steps carefully:

1. Open the YouTube video URL.
2. Wait for the page to load completely.
3. Scroll gradually to the comments section.
4. Wait for comments to load.
5. Extract up to 20 actual visible top-level comments.
6. For every comment collect:
   - author
   - text
   - like_count
   - timestamp

7. Do not extract video description as comments.
8. Do not invent or generate any comments.
9. If YouTube shows a sign-in page, CAPTCHA or bot verification,
   do not pretend extraction succeeded.
10. If comments cannot be accessed, return an empty comments array
    and explain the reason in extraction_note.

Return the video title, URL, comments_section_found,
comments and extraction_note.
        `,

        output_schema: {
            type: "object",
            properties: {
                video_title: {
                    type: "string"
                },
                video_url: {
                    type: "string"
                },
                comments_section_found: {
                    type: "boolean"
                },
                extraction_note: {
                    type: "string"
                },
                comments: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            author: {
                                type: "string"
                            },
                            text: {
                                type: "string"
                            },
                            like_count: {
                                type: "string"
                            },
                            timestamp: {
                                type: "string"
                            }
                        },
                        required: ["author", "text"]
                    }
                }
            },
            required: [
                "comments",
                "comments_section_found",
                "extraction_note"
            ]
        }
    };

    const response = await fetch(
        "https://agent.tinyfish.ai/v1/automation/run",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(300000)
        }
    );

    const data = await response.json();

    console.log(
        "TINYFISH RESPONSE:",
        JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
        throw new Error(
            data.error?.message ||
            `TinyFish Agent error: ${response.status}`
        );
    }

    if (data.status !== "COMPLETED" || !data.result) {
        throw new Error(
            data.error?.message ||
            "TinyFish Agent could not complete extraction"
        );
    }

    const result =
        typeof data.result === "string"
            ? JSON.parse(data.result)
            : data.result;

    const comments = Array.isArray(result.comments)
        ? result.comments.filter(
            comment =>
                comment &&
                typeof comment.text === "string" &&
                comment.text.trim().length > 0
        )
        : [];

    console.log("Comments extracted:", comments.length);

    return {
        title: result.video_title || null,
        url: result.video_url || url,
        content: JSON.stringify(result, null, 2),
        comments,
        comments_section_found:
            result.comments_section_found ?? false,
        extraction_note:
            result.extraction_note || "No extraction details provided",
        tinyfish_run_id: data.run_id || data.id || null,
        errors: []
    };
}

module.exports = { fetchPage };
