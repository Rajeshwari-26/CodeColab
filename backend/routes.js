const express = require("express");
const router = express.Router();

const { executeCode } = require("./executor");

// Fix #9: Validate and log roomId/userId (they were silently ignored before)
router.post("/execute", async (req, res) => {
  const { code, language, roomId, userId } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      output: "",
      error: "Missing required fields: code and language",
      status: "error",
    });
  }

  console.log(`[Execute] room=${roomId} user=${userId} lang=${language} code_length=${code.length}`);

  try {
    const result = await executeCode({ code, language });
    return res.json(result);
  } catch (err) {
    console.error("[Execute] Unhandled error:", err);
    return res.status(500).json({
      output: "",
      error: "Internal server error",
      status: "error",
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;