
import React, { useState, useRef } from "react";
// abhi update kiye hai
import { streamText } from "./services/ai";
import { Paperclip } from "lucide-react"; // 📎 icon


export default function App() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi Rohit 👋, ask me anything!" }
  ]);

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const cancelRef = useRef(null);
  const fileInputRef = useRef(null);

  // 📌 Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]; // only base64
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // 📌 Handle Send (Image + Text)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    // show user message
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    let url = "http://localhost:5000/api/generate-text";
    let body = { prompt: input };

    // agar image select hai to vision API
    if (selectedImage) {
      url = "http://localhost:5000/api/generate-vision";
      body = { prompt: input, imageBase64: selectedImage };
    }

    setLoading(true);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    setMessages((prev) => [...prev, { role: "bot", text: data.text }]);

    setInput("");
    setSelectedImage(null);
    setLoading(false);
  };

  // 📌 Streaming Submit (sirf text ke liye)
  async function onSubmit(e) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    if (selectedImage) {
      // agar image select hai → normal send karna hai
      return handleSend(e);
    }

    // text only streaming
    setMessages((prev) => [...prev, { role: "user", text: prompt }, { role: "bot", text: "" }]);
    setInput("");
    setLoading(true);

    cancelRef.current = streamText(prompt, {
      onChunk: (delta) => {
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          next[lastIdx] = { ...next[lastIdx], text: next[lastIdx].text + delta };
          return next;
        });
      },
      onDone: () => {
        setLoading(false);
        cancelRef.current = null;
      },
      onError: (err) => {
        setLoading(false);
        cancelRef.current = null;
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ " + (err.message || "Stream error") }]);
      },
    });
  }

  function stopStreaming() {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="container">
     
      <div className="card">
        <h1>Gemini Chat (Streaming + Vision)</h1>
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={"msg " + (m.role === "user" ? "user" : "bot")}>
              {m.text}
              {i === messages.length - 1 && m.role === "bot" && loading ? "▍" : ""}
            </div>
          ))}
        </div>

        {/* 📌 Updated Chat Input */}
        <form onSubmit={onSubmit} className="chat-input">
          <div className="input-wrapper" style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
            
            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />

            {/* Text Input */}
            <input
              type="text"
              placeholder="Type your prompt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, paddingRight: "40px" }} // padding for icon
            />

            {/* 📎 Icon inside input */}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                position: "absolute",
                right: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#888"
              }}
            >
              <Paperclip size={20} />
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Send"}
          </button>
          <button type="button" onClick={stopStreaming} disabled={!loading}>
            Stop
          </button>
        </form>

        <div className="hint">Tip: Streaming uses SSE at /api/stream</div>
      </div>
       
    </div>
  );
}

