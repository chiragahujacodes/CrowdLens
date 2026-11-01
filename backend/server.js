
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const analyzeRoute = require("./routes/analyze");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// API routes
app.use("/api/analyze", analyzeRoute);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CrowdLens API is running!",
        status: "healthy"
    });
});

// Serve frontend files
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// Frontend entry point
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Handle unexpected errors
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    res.status(500).json({
        success: false,
        error: "Internal server error"
    });
});

// Start server
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("CROWDLENS SERVER STARTED");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/health`);
    console.log("--------------------------------");
});
