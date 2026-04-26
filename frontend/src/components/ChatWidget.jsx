import { useState, useRef, useEffect } from "react";
import API from "../api/axiosConfig";
import { getRequestErrorMessage } from "../utils/requestErrors";
import "./ChatWidget.css";

export default function ChatWidget({ mode = "landing" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: mode === "landing"
        ? "Hi! I'm the CloudBox Assistant 👋 Ask me anything about CloudBox — features, pricing, how to use it!"
        : mode === "admin"
        ? "Hi Admin! 👋 Ask me about users, payments, revenue, files, or plan configs."
        : "Hi! I'm your CloudBox Assistant 👋 Ask me about your files, storage usage, or anything about your account!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text }]);
    setLoading(true);
    try {
      let endpoint = "/chat/landing";
      if (mode === "dashboard") endpoint = "/chat/dashboard";
      if (mode === "admin") endpoint = "/chat/admin";

      const res = await API.post(endpoint, { message: text });
      setMessages(p => [...p, { role: "bot", text: res.data.reply }]);
    } catch (error) {
      setMessages((p) => [
        ...p,
        {
          role: "bot",
          text: getRequestErrorMessage(error, "Sorry, I couldn't process that. Please try again in a moment."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cw-wrap">
      {/* Chat window */}
      {open && (
        <div className="cw-window">
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-avatar"><i className="fa-solid fa-cloud"></i></div>
              <div>
                <div className="cw-title">CloudBox Assistant</div>
                <div className="cw-status"><span className="cw-dot" />Online</div>
              </div>
            </div>
            <button className="cw-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="cw-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cw-msg ${m.role}`}>
                {m.role === "bot" && <div className="cw-bot-avatar"><i className="fa-solid fa-cloud"></i></div>}
                <div className="cw-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="cw-msg bot">
                <div className="cw-bot-avatar"><i className="fa-solid fa-cloud"></i></div>
                <div className="cw-bubble cw-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="cw-input-row">
            <input
              className="cw-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button className="cw-send" onClick={send} disabled={loading || !input.trim()}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button className="cw-fab" onClick={() => setOpen(o => !o)} title="Chat with Assistant">
        {open
          ? <i className="fa-solid fa-xmark" />
          : <i className="fa-solid fa-comment-dots" />}
      </button>
    </div>
  );
}
