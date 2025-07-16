# TodoApp: Full-Stack Task Management Application

## Overview
**TodoApp** is a comprehensive task management solution built with modern web technologies. It features a secure ASP.NET Core Web API backend and a responsive React frontend with TypeScript, providing users with an intuitive platform to organize, track, and manage their daily tasks efficiently.

---

## Features

### 🔐 User Authentication & Security
- **JWT Token-Based Authentication**: Secure login system with token expiration
- **User Isolation**: Each user can only access their own tasks
- **Password Security**: Hashed password storage with proper validation
- **Authorization**: Protected API endpoints with role-based access

---

### 📋 Task Management
- **Create Tasks**: Add new tasks with titles and optional due dates
- **Edit Tasks**: Update task details, due dates, and completion status
- **Delete Tasks**: Remove tasks with confirmation prompts
- **Toggle Completion**: Quick one-click status updates
- **Task Validation**: Client and server-side input validation

---

### 🔍 Advanced Filtering & Search
- **Status Filtering**: Filter tasks by completion status (All/Completed/Pending)
- **Date Filtering**: Filter tasks by specific due dates
- **Real-time Search**: Search tasks by title with instant results
- **Reset Filters**: One-click filter reset functionality

---

### 📊 Dashboard & Analytics
- **Task Summary**: Real-time overview of total, completed, and pending tasks
- **Progress Tracking**: Visual indicators for task completion rates
- **Data Table**: Sortable, paginated table with customizable rows per page
- **Interactive UI**: Click-to-toggle completion and intuitive icons

---

### 🎨 Modern User Interface
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design that works on all devices
- **Loading States**: Smooth loading indicators and animations
- **Error Handling**: User-friendly error messages and notifications
- **Accessibility**: Keyboard navigation and screen reader support

---

## ⚙️ Tech Stack

| Component       | Technology                    |
|----------------|-------------------------------|
| Backend        | ASP.NET Core 8.0, C#        |
| Frontend       | React 18, TypeScript         |
| Database       | SQL Server, Entity Framework |
| Authentication | JWT Bearer Tokens            |
| Styling        | Tailwind CSS                 |
| State Management| React Context API           |
| HTTP Client    | Fetch API                    |
| Validation     | Data Annotations             |

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Todo Management
- `GET /api/todo` - Get all todos for current user
- `GET /api/todo/{id}` - Get specific todo
- `GET /api/todo/filter` - Filter todos by status/date
- `GET /api/todo/summary` - Get todo statistics
- `POST /api/todo` - Create new todo
- `PUT /api/todo/{id}` - Update todo
- `DELETE /api/todo/{id}` - Delete todo
- `PATCH /api/todo/{id}/toggle` - Toggle completion

---

## Installation & Setup

### Prerequisites
- .NET 8.0 SDK
- Node.js (v16+)
- SQL Server

### Backend Setup
```bash
# Clone repository
https://github.com/Princearya34/task-organizer.git
cd ToDoApp

# Restore packages
dotnet restore

# Update database
dotnet ef database update

# Run application
dotnet run
```

### Frontend Setup
```bash
# Navigate to frontend
cd todo-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Configuration

### Database Connection
Update `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TodoAppDB;Trusted_Connection=true;"
  },
  "Jwt": {
    "Key": "your-secret-key-minimum-32-characters",
    "Issuer": "TodoApp",
    "Audience": "TodoApp",
    "ExpiryMinutes": 60
  }
}
```

---

## Future Enhancements
- Task categories and tags
- Task priorities and reminders
- Team collaboration features
- Mobile app development
- Advanced analytics and reporting
- Task templates and recurring tasks
- Export/import functionality
- Integration with calendar applications

---

## License
MIT License. See `LICENSE` file for details.
