import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { DataTable, TableColumn } from "./DataTable";
import { ThemeProvider, useTheme } from "./ThemeContext";
import MoonIcon from "./icons/MoonIcon";
import SunIcon from "./icons/SunIcon";

interface TodoItem {
  id: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  reminderDateTime?: string;
}

function TodoAppInner() {
  const { token, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
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

  const apiUrl = "https://todoapp-princearya-brc9cvdmbegqcwfk.eastasia-01.azurewebsites.net/api/todo";

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
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          reminderDateTime: reminderDateTime
            ? new Date(reminderDateTime).toISOString()
            : null,
        }),
      });
      if (!res.ok) throw new Error(`Failed to add task: ${res.status} ${res.statusText}`);
      setTitle(""); setDescription(""); setDueDate(""); setReminderDateTime(""); setIsCompleted(false);
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
      setDescription(data.description || "");
      setDueDate(data.dueDate?.split("T")[0] || "");
      setReminderDateTime(data.reminderDateTime
        ? data.reminderDateTime.slice(0, 16)
        : ""
      );
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
        body: JSON.stringify({
          id: editId,
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          reminderDateTime: reminderDateTime
            ? new Date(reminderDateTime).toISOString()
            : null,
          isCompleted,
        }),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
      setMessage({ type: "success", text: "Task updated successfully!" });
      setTitle(""); setDescription(""); setDueDate(""); setReminderDateTime(""); setIsCompleted(false); setEditId(null);
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update task" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null); setTitle(""); setDescription(""); setDueDate(""); setReminderDateTime(""); setIsCompleted(false);
  };

  const resetFilters = () => {
    setFilterCompleted(""); setFilterDate(""); setSearchText("");
  };

  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (todo.description || "").toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    if (token) {
      loadTodos();
      loadSummary();
    }
    // eslint-disable-next-line
  }, [filterCompleted, filterDate, token]);

  const columns: TableColumn<TodoItem>[] = [
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      cell: (row) => (
        <span
          onClick={() => toggleTodo(row.id)}
          className={`cursor-pointer font-semibold transition-all duration-200 ${
            row.isCompleted
              ? "line-through text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              : "text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
          }`}
          title="Click to toggle completion"
        >
          {row.title}
        </span>
      ),
    },
    {
      name: "Description",
      selector: (row) => row.description || "",
      sortable: false,
      cell: (row) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {row.description || <span className="italic">No description</span>}
        </span>
      ),
    },
    {
      name: "Due Date",
      selector: (row) => row.dueDate || "",
      sortable: true,
      cell: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      name: "Reminder",
      selector: (row) => row.reminderDateTime || "",
      sortable: true,
      cell: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {row.reminderDateTime ? new Date(row.reminderDateTime).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => (row.isCompleted ? "Completed" : "Pending"),
      sortable: true,
      cell: (row) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          row.isCompleted
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
            : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
        }`}>
          <span className="mr-1">{row.isCompleted ? "✓" : "⏳"}</span>
          {row.isCompleted ? "Completed" : "Pending"}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => startEdit(row.id)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => deleteTodo(row.id)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3">
                ✨ TaskFlow
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                Organize your life, one task at a time
              </p>
            </div>

            {/* User Controls */}
            <div className="flex flex-wrap justify-center items-center gap-4 p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200 hover:scale-105"
                title="Toggle theme"
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user?.username}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:shadow-lg font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Enhanced Summary */}
          {summary && (
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-xl">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.completed}</div>
                  <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</div>
                </div>
                <div className="text-center p-4 bg-amber-50/80 dark:bg-amber-900/30 rounded-xl">
                  <div className="text-3xl mb-2">⏳</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.pending}</div>
                  <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`rounded-xl p-4 border shadow-lg backdrop-blur-sm ${
              message.type === "error"
                ? "bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200"
                : "bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {message.type === "error" ? "❌" : "✅"}
                </span>
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Enhanced Filters */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Filter & Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                  value={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.value)}
                >
                  <option value="">All Tasks</option>
                  <option value="true">Completed</option>
                  <option value="false">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-slate-400"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-4 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Add/Edit Form */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">{editId ? "✏️" : "➕"}</span>
              {editId ? "Edit Task" : "Create New Task"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Reminder
                </label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <button
                onClick={editId ? updateTodo : addTodo}
                disabled={submitting}
                className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {editId ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <span className="text-lg">{editId ? "💾" : "➕"}</span>
                    {editId ? "Update Task" : "Add Task"}
                  </>
                )}
              </button>
              
              {editId && (
                <>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-xl">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => setIsCompleted(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mark as completed</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Tasks Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Your Tasks
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {filteredTodos.length}
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Rows per page:
                  </label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1 text-sm font-medium shadow-sm"
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
      </div>
    </div>
  );
}

export function TodoApp() {
  return (
    <ThemeProvider>
      <TodoAppInner />
    </ThemeProvider>
  );
}