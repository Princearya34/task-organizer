import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { DataTable, TableColumn } from "./DataTable";
import { ThemeProvider, useTheme } from "./ThemeContext";
import MoonIcon from "./icons/MoonIcon";
import SunIcon from "./icons/SunIcon";

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

function TodoAppInner() {
  const { token, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState<string>("");
  const [filterDate, setFilterDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [summary, setSummary] = useState<{ total: number; completed: number; pending: number } | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const apiUrl = "http://localhost:5088/api/todo";

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.message?.toLowerCase().includes("expired")) {
        logout();
        throw new Error("Authentication expired. Please login again.");
      } else {
        throw new Error("Unauthorized. Please check your credentials.");
      }
    }
    return response;
  };

  const loadTodos = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterCompleted) query.append("completed", filterCompleted);
      if (filterDate) query.append("dueDate", filterDate);
      const endpoint = query.toString() ? `${apiUrl}/filter?${query}` : apiUrl;
      const res = await apiCall(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch todos: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load todos" });
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await apiCall(`${apiUrl}/summary`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  };

  const addTodo = async () => {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Task title cannot be empty" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiCall(apiUrl, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), dueDate: dueDate || null }),
      });
      if (!res.ok) throw new Error(`Failed to add task: ${res.status} ${res.statusText}`);
      setTitle(""); setDueDate(""); setIsCompleted(false);
      setMessage({ type: "success", text: "Task added successfully!" });
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to add task" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await apiCall(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      setMessage({ type: "success", text: "Task deleted successfully" });
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete task" });
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const res = await apiCall(`${apiUrl}/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status} ${res.statusText}`);
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update task status" });
    }
  };

  const startEdit = async (id: number) => {
    try {
      const res = await apiCall(`${apiUrl}/${id}`);
      if (!res.ok) throw new Error(`Failed to get item: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setEditId(id);
      setTitle(data.title);
      setDueDate(data.dueDate?.split("T")[0] || "");
      setIsCompleted(data.isCompleted);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load item for editing" });
    }
  };

  const updateTodo = async () => {
    if (!title.trim() || editId === null) {
      setMessage({ type: "error", text: "Task title cannot be empty" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiCall(`${apiUrl}/${editId}`, {
        method: "PUT",
        body: JSON.stringify({ id: editId, title: title.trim(), dueDate: dueDate || null, isCompleted }),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
      setMessage({ type: "success", text: "Task updated successfully!" });
      setTitle(""); setDueDate(""); setIsCompleted(false); setEditId(null);
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update task" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null); setTitle(""); setDueDate(""); setIsCompleted(false);
  };

  const resetFilters = () => {
    setFilterCompleted(""); setFilterDate(""); setSearchText("");
  };

  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    if (token) {
      loadTodos();
      loadSummary();
    }
  }, [filterCompleted, filterDate, token]);

  const columns: TableColumn<TodoItem>[] = [
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <span
            onClick={() => toggleTodo(row.id)}
            className={`cursor-pointer font-medium transition-colors ${
              row.isCompleted
                ? "line-through text-green-600 hover:text-green-700"
                : "text-gray-800 dark:text-gray-200 hover:text-blue-600"
            }`}
            title="Click to toggle completion status"
          >
            {row.title}
          </span>
        </div>
      ),
    },
    {
      name: "Due Date",
      selector: (row) => row.dueDate || "",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <span className="text-gray-600 dark:text-gray-400">
            {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}
          </span>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => (row.isCompleted ? "Completed" : "Pending"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.isCompleted
              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
          }`}>
            {row.isCompleted ? "✅ Completed" : "⏳ Pending"}
          </span>
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => startEdit(row.id)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => deleteTodo(row.id)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header with User Info and Logout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📝 Todo List
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize your tasks efficiently
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle dark mode"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, <span className="font-semibold">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-6">
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📊</span>
                <span className="text-gray-700 dark:text-gray-300">Total: </span>
                <span className="font-semibold text-gray-900 dark:text-white ml-1">{summary.total}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Completed: </span>
                <span className="font-semibold text-green-600 dark:text-green-400 ml-1">{summary.completed}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⏳</span>
                <span className="text-gray-700 dark:text-gray-300">Pending: </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400 ml-1">{summary.pending}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-xl mr-2">🔍</span>
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value)}
              >
                <option value="">All Tasks</option>
                <option value="true">Completed</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={resetFilters}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center h-12"
              >
                <span className="mr-2">🔄</span>
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`rounded-lg p-4 ${
            message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100"
              : "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100"
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {message.type === "error" ? "❌" : "✅"}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Add/Edit Todo Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-xl mr-2">{editId ? "✏️" : "➕"}</span>
            {editId ? "Edit Task" : "Add New Task"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex space-x-2 w-full h-12">
                <button
                  onClick={editId ? updateTodo : addTodo}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editId ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <span className="mr-2">{editId ? "💾" : "➕"}</span>
                      {editId ? "Update Task" : "Add Task"}
                    </>
                  )}
                </button>
                {editId && (
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
          {editId && (
            <div className="mt-6 flex items-center">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Mark as completed</span>
              </label>
            </div>
          )}
        </div>

        {/* Todos Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="text-xl mr-2">📋</span>
                Your Tasks ({filteredTodos.length})
              </h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Rows per page:
                </label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredTodos}
            pagination={true}
            paginationPerPage={rowsPerPage}
            progressPending={loading}
            highlightOnHover={true}
          />
        </div>
      </div>
    </main>
  );
}

export function TodoApp() {
  return (
    <ThemeProvider>
      <TodoAppInner />
    </ThemeProvider>
  );
}