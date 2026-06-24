const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const executeCode = async (code, language, roomId, userId) => {
  try {
    const res = await fetch(`${BACKEND_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        language,
        roomId,
        userId
      })
    });

    return await res.json();
  } catch {
    throw new Error("Backend not running");
  }
};