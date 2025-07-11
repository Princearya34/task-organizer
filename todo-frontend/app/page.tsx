"use client";
import { useEffect, useState } from "react";

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export default function Home() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const apiUrl = "http://localhost:5088/api/todo";

  const loadTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Task title cannot be empty" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate: dueDate || null }),
      });
      if (!res.ok) throw new Error("Failed to add task");

      setTitle("");
      setDueDate("");
      setMessage({ type: "success", text: "Task added successfully!" });
      loadTodos();
    } catch (err) {
      setMessage({ type: "error", text: "Error adding task" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessage({ type: "success", text: "Task deleted" });
      loadTodos();
    } catch {
      setMessage({ type: "error", text: "Error deleting task" });
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error("Toggle failed");
      loadTodos();
    } catch {
      setMessage({ type: "error", text: "Error toggling task" });
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  return (
    <main className="max-w-2xl mx-auto mt-10 px-4 font-sans">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">📝 ToDo List</h1>

      <div className="grid sm:grid-cols-5 gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a task"
          className="sm:col-span-2 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="sm:col-span-2 p-3 border border-gray-300 rounded-md shadow-sm"
        />
        <button
          onClick={addTodo}
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 sm:col-span-1"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 text-sm px-4 py-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center mt-4">Loading tasks...</div>
      ) : todos.length === 0 ? (
        <div className="text-gray-500 text-center mt-4">No tasks available</div>
      ) : (
        <ul className="space-y-3 mt-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex justify-between items-center bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:bg-gray-50 transition"
            >
              <div>
                <span
                  onClick={() => toggleTodo(todo.id)}
                  className={`cursor-pointer ${
                    todo.isCompleted ? "line-through text-green-600" : "text-gray-800"
                  }`}
                >
                  {todo.title}
                </span>
                {todo.dueDate && (
                  <div className="text-xs text-gray-500">
                    Due: {new Date(todo.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
