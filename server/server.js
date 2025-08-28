
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Existing simple text generation (non-stream)
app.post("/api/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ ok: false, error: "Prompt is required" });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ ok: true, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
});

// NEW: Streaming via Server-Sent Events (SSE)
app.get("/api/stream", async (req, res) => {
  try {
    const prompt = req.query.prompt;
    if (!prompt || typeof prompt !== "string") {
      res.status(400);
      return res.end("Prompt is required");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
      }
    }

    const full = await result.response;
    const fullText = full.text();
    res.write(`data: ${JSON.stringify({ done: true, text: fullText })}\n\n`);
    res.end();
  } catch (err) {
    console.error("SSE error:", err);
    try {
      res.write(`data: ${JSON.stringify({ error: err.message || "Stream error" })}\n\n`);
    } catch {}
    res.end();
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


// imge future ke liye
app.post("/api/generate-vision", async (req, res) => {
  try {
    const { prompt, imageBase64 } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png", // ya "image/jpeg" (jo file ho)
          data: imageBase64,     // base64 string image ka
        },
      },
    ]);

    const text = result.response.text();
    res.json({ text });
  } catch (error) {
    console.error("Vision API Error:", error);
    res.status(500).json({ error: "Image analysis failed" });
  }
});

