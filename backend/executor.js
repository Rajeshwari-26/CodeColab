const axios = require("axios");

// Fix #6: Read API key from env (used for RapidAPI-hosted Judge0)
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com";

// Judge0 language IDs
const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  cpp: 54,
  c: 50,
  java: 62,
};

// Fix #8: Keep the full traceback — it's essential for debugging
function formatError(stderr, compileOutput) {
  if (stderr) return stderr.trim();
  if (compileOutput) return compileOutput.trim();
  return null;
}

async function executeCode({ code, language }) {
  const language_id = LANGUAGE_IDS[language?.toLowerCase()];

  if (!language_id) {
    return {
      output: "",
      error: `Unsupported language: "${language}". Supported: python, javascript, cpp, c, java`,
      status: "error",
    };
  }

  // Fix #7: Add a timeout to axios so a slow Judge0 doesn't hang the server
  const TIMEOUT_MS = 10000; // 10 seconds

  try {
    let response;

    if (JUDGE0_API_KEY) {
      // RapidAPI-hosted Judge0 (authenticated, higher limits)
      response = await axios.post(
        `https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`,
        { source_code: code, language_id },
        {
          timeout: TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": JUDGE0_HOST,
          },
        }
      );
    } else {
      // Public Judge0 CE fallback (rate-limited, no key needed)
      response = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        { source_code: code, language_id },
        { timeout: TIMEOUT_MS }
      );
    }

    const result = response.data;
    const statusDesc = result.status?.description || "";

    // Handle specific Judge0 status codes
    if (statusDesc === "Time Limit Exceeded") {
      return { output: "", error: "Execution timed out (time limit exceeded)", status: "timeout" };
    }

    if (statusDesc === "Memory Limit Exceeded") {
      return { output: "", error: "Memory limit exceeded", status: "error" };
    }

    const error = formatError(result.stderr, result.compile_output);

    return {
      output: result.stdout || "",
      error,
      status: statusDesc === "Accepted" ? "success" : "error",
    };

  } catch (err) {
    // Fix #7: Distinguish timeout from other errors
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return {
        output: "",
        error: "Execution timed out — Judge0 did not respond in time",
        status: "timeout",
      };
    }

    console.error("[Executor] Error:", err.message);
    return {
      output: "",
      error: "Execution failed — could not reach the code runner",
      status: "error",
    };
  }
}

module.exports = { executeCode };