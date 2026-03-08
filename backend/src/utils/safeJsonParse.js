export const safeJsonParse = (text) => {
  try {
    // 1️⃣ Extract JSON array or object
    const jsonMatch = text.match(/(\[.*\]|\{.*\})/s);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    let jsonString = jsonMatch[0];

    // 2️⃣ Remove invalid control characters
    jsonString = jsonString
      .replace(/[\u0000-\u001F]+/g, " ")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\t/g, " ");

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("❌ JSON Parse Failed:", err.message);
    throw new Error("Invalid JSON from AI");
  }
};
