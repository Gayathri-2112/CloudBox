import React, { useEffect, useState } from "react";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc
} from "firebase/firestore";

// 🔥 Firebase config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8oPAtaGN8jtSrv9MpIMwLJBWlLerOuNg",
  authDomain: "cloudbox-kanban.firebaseapp.com",
  projectId: "cloudbox-kanban",
  storageBucket: "cloudbox-kanban.firebasestorage.app",
  messagingSenderId: "395550158137",
  appId: "1:395550158137:web:7707200296e83bbccb0ce8",
  measurementId: "G-67LDWJR1YS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Kanban() {
  const [board, setBoard] = useState({
    todo: [],
    inprogress: [],
    done: [],
  });

  const [taskText, setTaskText] = useState("");
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [priority, setPriority] = useState("low");

  const boardId =
    window.location.pathname.split("/kanban/")[1] || "default";

  const docRef = doc(db, "boards", boardId);

  useEffect(() => {
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBoard(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const saveBoard = async (newBoard) => {
    setBoard(newBoard);
    await setDoc(docRef, newBoard);
  };

  const addTask = () => {
    if (!taskText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      user: username || "Anonymous",
      priority,
    };

    saveBoard({
      ...board,
      todo: [...board.todo, newTask],
    });

    setTaskText("");
  };

  const deleteTask = (id, column) => {
    const updated = board[column].filter((t) => t.id !== id);
    saveBoard({ ...board, [column]: updated });
  };

  const editTask = (task, column) => {
    const newText = prompt("Edit task:", task.text);
    if (!newText) return;

    const updated = board[column].map((t) =>
      t.id === task.id ? { ...t, text: newText } : t
    );

    saveBoard({ ...board, [column]: updated });
  };

  const onDragStart = (e, task, fromColumn) => {
    e.dataTransfer.setData(
      "task",
      JSON.stringify({ task, fromColumn })
    );
  };

  const onDrop = (e, toColumn) => {
    const { task, fromColumn } = JSON.parse(
      e.dataTransfer.getData("task")
    );

    if (fromColumn === toColumn) return;

    const updatedFrom = board[fromColumn].filter(
      (t) => t.id !== task.id
    );
    const updatedTo = [...board[toColumn], task];

    saveBoard({
      ...board,
      [fromColumn]: updatedFrom,
      [toColumn]: updatedTo,
    });
  };

  const allowDrop = (e) => e.preventDefault();

  const getColor = (priority) => {
    if (priority === "high") return "#fecaca";
    if (priority === "medium") return "#fde68a";
    return "#bbf7d0";
  };

  return (
    <div style={styles.wrapper}>
      <style>{css}</style>

      <h2>Kanban Board</h2>

      <div className="topBar">
        <input
          placeholder="Your name"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            localStorage.setItem("username", e.target.value);
          }}
        />

        <input
          placeholder="Enter feature / task..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>

        <button onClick={addTask}>+ Add</button>
      </div>

      <div className="board">
        {["todo", "inprogress", "done"].map((col) => (
          <div
            key={col}
            className="column"
            onDrop={(e) => onDrop(e, col)}
            onDragOver={allowDrop}
          >
            <h3>{col.toUpperCase()}</h3>

            {board[col].map((task) => (
              <div
                key={task.id}
                className="task"
                style={{ background: getColor(task.priority) }}
                draggable
                onDragStart={(e) =>
                  onDragStart(e, task, col)
                }
              >
                <b>{task.text}</b>
                <small>👤 {task.user}</small>

                <div>
                  <button onClick={() => editTask(task, col)}>✏️</button>
                  <button onClick={() => deleteTask(task.id, col)}>❌</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 🔥 FORCE FULL WIDTH + ISOLATED STYLES
const styles = {
  wrapper: {
    width: "100vw",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
    background: "#f9fafb",
  },
};

// 🔥 SCOPED CSS (overrides everything)
const css = `
.topBar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.topBar input, .topBar select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.topBar button {
  padding: 10px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.board {
  display: flex;
  gap: 20px;
  width: 100%;
}

.column {
  flex: 1;
  min-width: 0;
  background: #f3f4f6;
  padding: 10px;
  border-radius: 10px;
}

.task {
  margin: 10px 0;
  padding: 10px;
  border-radius: 6px;
  cursor: grab;
}
`;