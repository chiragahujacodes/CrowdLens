
require("dotenv").config();

const { analyzeComments } = require("./services/gemini");

const sampleComments = [
    {
        author: "@user1",
        text: "We need this type of javascript tutorial also",
        like_count: "100",
        timestamp: "2 months ago"
    },
    {
        author: "@user2",
        text: "Where is the image link for Amazon project?",
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

async function testGemini() {
    try {
        const result = await analyzeComments(
            sampleComments,
            "CSS Tutorial for Beginners"
        );

        console.log("\nGEMINI TEST SUCCESSFUL!");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("\nGEMINI TEST FAILED:");
        console.error(error.message);
    }
}

testGemini();
