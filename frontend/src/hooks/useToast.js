import { useState, useCallback, useMemo } from "react";

let idCounter = 0;

export function useToast() {
  const [messages, setMessages] = useState([]);

  const addToast = useCallback((text, type = "info") => {
    const id = ++idCounter;
    setMessages((prev) => [...prev, { id, text, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const success = useCallback((text) => addToast(text, "success"), [addToast]);
  const error = useCallback((text) => addToast(text, "error"), [addToast]);
  const info = useCallback((text) => addToast(text, "info"), [addToast]);
  const warning = useCallback((text) => addToast(text, "warning"), [addToast]);

  const toast = useMemo(
    () => ({ success, error, info, warning }),
    [success, error, info, warning]
  );

  return { messages, removeToast, toast };
}
