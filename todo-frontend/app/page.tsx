"use client";

import { useEffect, useState } from "react";

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

interface TableColumn<T> {
  name: string;
  selector?: (row: T) => any;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  pagination?: boolean;
  paginationPerPage?: number;
  progressPending?: boolean;
  highlightOnHover?: boolean;
  responsive?: boolean;
  persistTableHead?: boolean;
}

// Custom DataTable component to replace react-data-table-component
function DataTable<T extends { id: number }>({ 
  columns, 
  data, 
  pagination = false, 
  paginationPerPage = 10, 
  progressPending = false,
  highlightOnHover = true 
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const column = columns.find(col => col.name === sortField);
    if (!column?.selector) return 0;
    
    const aVal = column.selector(a);
    const bVal = column.selector(b);
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * paginationPerPage, currentPage * paginationPerPage)
    : sortedData;

  const totalPages = Math.ceil(sortedData.length / paginationPerPage);

  if (progressPending) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => column.sortable && column.selector && handleSort(column.name)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" : ""
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    {column.sortable && sortField === column.name && (
                      <span className="text-blue-600">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className={highlightOnHover ? "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" : ""}
              >
                {columns.map((column, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {column.cell ? column.cell(row) : column.selector ? column.selector(row) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * paginationPerPage) + 1} to {Math.min(currentPage * paginationPerPage, sortedData.length)} of {sortedData.length} entries
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      
      {paginatedData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}

export default function Home() {
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

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterCompleted) query.append("completed", filterCompleted);
      if (filterDate) query.append("dueDate", filterDate);
      const endpoint = query.toString() ? `${apiUrl}/filter?${query}` : apiUrl;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch todos: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading todos:", err);
      setMessage({ type: "error", text: err.message || "Failed to load todos" });
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await fetch(`${apiUrl}/summary`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Error loading summary:", err);
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
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), dueDate: dueDate || null }),
      });
      if (!res.ok) throw new Error(`Failed to add task: ${res.status} ${res.statusText}`);
      
      // Reset form
      setTitle("");
      setDueDate("");
      setIsCompleted(false);
      setMessage({ type: "success", text: "Task added successfully!" });
      
      // Reload data
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      console.error("Error adding task:", err);
      setMessage({ type: "error", text: err.message || "Failed to add task" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      setMessage({ type: "success", text: "Task deleted successfully" });
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setMessage({ type: "error", text: err.message || "Failed to delete task" });
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status} ${res.statusText}`);
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      console.error("Error toggling task:", err);
      setMessage({ type: "error", text: err.message || "Failed to update task status" });
    }
  };

  const startEdit = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/${id}`);
      if (!res.ok) throw new Error(`Failed to get item: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setEditId(id);
      setTitle(data.title);
      setDueDate(data.dueDate?.split("T")[0] || "");
      setIsCompleted(data.isCompleted);
    } catch (err: any) {
      console.error("Error loading item for edit:", err);
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
      const res = await fetch(`${apiUrl}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editId, 
          title: title.trim(), 
          dueDate: dueDate || null, 
          isCompleted 
        }),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
      
      setMessage({ type: "success", text: "Task updated successfully!" });
      
      // Reset form
      setTitle("");
      setDueDate("");
      setIsCompleted(false);
      setEditId(null);
      
      // Reload data
      await Promise.all([loadTodos(), loadSummary()]);
    } catch (err: any) {
      console.error("Error updating task:", err);
      setMessage({ type: "error", text: err.message || "Failed to update task" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDueDate("");
    setIsCompleted(false);
  };

  const resetFilters = () => {
    setFilterCompleted("");
    setFilterDate("");
    setSearchText("");
  };

  const filteredTodos = todos.filter((todo) =>
    todo.title.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    loadTodos();
    loadSummary();
  }, [filterCompleted, filterDate]);

  const columns: TableColumn<TodoItem>[] = [
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      cell: (row) => (
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
      ),
    },
    {
      name: "Due Date",
      selector: (row) => row.dueDate || "",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => (row.isCompleted ? "Completed" : "Pending"),
      sortable: true,
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.isCompleted 
            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
        }`}>
          {row.isCompleted ? "✅ Completed" : "⏳ Pending"}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-2">
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📝 Todo List
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your tasks efficiently
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
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
            <div>
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
            <div>
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
            <div>
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
            <div className="flex items-end">
              <button 
                onClick={resetFilters}
                className="w-full p-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-xl mr-2">{editId !== null ? "✏️" : "➕"}</span>
            {editId !== null ? "Edit Task" : "Add New Task"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title *
              </label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter task title" 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                required
              />
            </div>
            <div className="lg:col-span-2">
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
            {editId !== null && (
              <div className="lg:col-span-1 flex items-end">
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300 p-3">
                  <input 
                    type="checkbox" 
                    checked={isCompleted} 
                    onChange={(e) => setIsCompleted(e.target.checked)} 
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  Completed
                </label>
              </div>
            )}
            <div className="lg:col-span-1 flex items-end space-x-2">
              <button 
                onClick={editId !== null ? updateTodo : addTodo} 
                disabled={submitting || !title.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? "Saving..." : editId !== null ? "Update" : "Add Task"}
              </button>
              {editId !== null && (
                <button 
                  onClick={cancelEdit}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
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
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Rows Per Page Selector */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows per page:
            </label>
            <select 
              value={rowsPerPage} 
              onChange={(e) => setRowsPerPage(Number(e.target.value))} 
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {[5, 10, 15, 20].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTodos.length} {filteredTodos.length === 1 ? 'task' : 'tasks'} found
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTodos}
          pagination
          paginationPerPage={rowsPerPage}
          progressPending={loading}
          highlightOnHover
          responsive
          persistTableHead
        />
      </div>
    </main>
  );
}