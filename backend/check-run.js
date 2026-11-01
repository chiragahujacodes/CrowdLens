
require("dotenv").config();

async function checkRun() {
    const runId = "0322516a-45aa-4fb6-9c8c-cb7b5d9d1ebd";

    const response = await fetch(
        `https://agent.tinyfish.ai/v1/runs/${runId}`,
        {
            headers: {
                "X-API-Key": process.env.TINYFISH_API_KEY
            }
        }
    );

    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));
}

checkRun().catch(console.error);
