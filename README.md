# TodoApp: Advanced Full-Stack Task Management Application

## Overview
**TodoApp** is a comprehensive task management solution built with modern web technologies and deployed on enterprise-grade cloud infrastructure. It features a secure ASP.NET Core Web API backend hosted on **Microsoft Azure** and a responsive React frontend deployed on **Vercel**, providing users with an intuitive platform to organize, track, and manage their daily tasks efficiently with advanced features like email reminders and detailed task descriptions.

---

## Features

### 🔐 User Authentication & Security
- **JWT Token-Based Authentication**: Secure login system with token expiration
- **User Isolation**: Each user can only access their own tasks
- **Password Security**: Hashed password storage with proper validation
- **Authorization**: Protected API endpoints with role-based access

---

### 📋 Advanced Task Management
- **Create Tasks**: Add new tasks with titles, detailed descriptions, and optional due dates
- **Task Descriptions**: Rich text descriptions for comprehensive task details
- **Edit Tasks**: Update task details, descriptions, due dates, and completion status
- **Delete Tasks**: Remove tasks with confirmation prompts
- **Toggle Completion**: Quick one-click status updates
- **Task Validation**: Client and server-side input validation

---

### 📧 Smart Reminder System
- **Email Notifications**: Automated email reminders for upcoming tasks
- **Custom Reminder Times**: Set personalized reminder schedules
- **Due Date Alerts**: Receive notifications before task deadlines
- **SMTP Integration**: Reliable email delivery system
- **Reminder Management**: Enable/disable reminders per task

---

### 🔍 Advanced Filtering & Search
- **Status Filtering**: Filter tasks by completion status (All/Completed/Pending)
- **Date Filtering**: Filter tasks by specific due dates
- **Real-time Search**: Search tasks by title and description with instant results
- **Reset Filters**: One-click filter reset functionality
- **Smart Sorting**: Sort by priority, due date, or creation time

---

### 📊 Dashboard & Analytics
- **Task Summary**: Real-time overview of total, completed, and pending tasks
- **Progress Tracking**: Visual indicators for task completion rates
- **Data Table**: Sortable, paginated table with customizable rows per page
- **Interactive UI**: Click-to-toggle completion and intuitive icons
- **Performance Metrics**: Track productivity and completion trends

---

### 🎨 Modern User Interface
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first design that works on all devices
- **Loading States**: Smooth loading indicators and animations
- **Error Handling**: User-friendly error messages and notifications
- **Accessibility**: Keyboard navigation and screen reader support
- **Interactive Elements**: Hover effects and smooth transitions

---

## ⚙️ Tech Stack

| Component         | Technology                      |
|------------------|---------------------------------|
| **Backend**      | ASP.NET Core 8.0, C#          |
| **Frontend**     | React 18, TypeScript          |
| **Database**     | Azure SQL Database             |
| **Backend Host** | Microsoft Azure App Service    |
| **Frontend Host**| Vercel                         |
| **Authentication**| JWT Bearer Tokens             |
| **Styling**      | Tailwind CSS                   |
| **State Management**| React Context API           |
| **HTTP Client**  | Fetch API                      |
| **Email Service**| SMTP Integration               |
| **Validation**   | Data Annotations               |

---

## 🌐 Live Application

### Production URLs
- **Frontend (Vercel)**: [https://your-app.vercel.app](https://your-app.vercel.app)
- **Backend API (Azure)**: [https://your-api.azurewebsites.net](https://your-api.azurewebsites.net)
- **Database**: Azure SQL Database (Managed)

---

## 🚀 Deployment Architecture

### Backend Deployment (Azure)
- **Azure App Service**: Scalable web app hosting
- **Azure SQL Database**: Managed database service
- **Application Insights**: Performance monitoring
- **Azure Key Vault**: Secure configuration management

### Frontend Deployment (Vercel)
- **Vercel Platform**: Optimized React hosting
- **CDN Integration**: Global content delivery
- **Automatic Deployments**: Git-based CI/CD
- **Environment Variables**: Secure configuration

---

## 📱 Screenshots & Demo

![Desktop View](https://drive.google.com/file/d/1EN2wSePlIW5C-XBYW-8wfxrGneyUWi9K/view?usp=sharing)

---

## 🛠️ Installation & Setup

### Prerequisites
```bash
# Required software
- .NET 8.0 SDK
- Node.js (v18+)
- Azure Account (for deployment)
- Vercel Account (for frontend deployment)
```

### Local Development Setup

#### Backend Setup
```bash
# Clone repository
git clone https://github.com/Princearya34/task-organizer.git
cd ToDoApp

# Restore packages
dotnet restore

# Set up user secrets for local development
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-local-connection-string"
dotnet user-secrets set "Jwt:Key" "your-secret-key-minimum-32-characters"
dotnet user-secrets set "EmailSettings:SmtpServer" "smtp.gmail.com"
dotnet user-secrets set "EmailSettings:SmtpPort" "587"
dotnet user-secrets set "EmailSettings:Username" "your-email@gmail.com"
dotnet user-secrets set "EmailSettings:Password" "your-app-password"

# Update database
dotnet ef database update

# Run application
dotnet run
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd todo-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update environment variables
echo "REACT_APP_API_URL=https://localhost:7001/api" >> .env.local
echo "REACT_APP_ENV=development" >> .env.local

# Start development server
npm run dev
```

---

## ⚙️ Configuration

### Backend Configuration (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-azure-server.database.windows.net;Database=TodoAppDB;User Id=your-username;Password=your-password;Encrypt=true;"
  },
  "Jwt": {
    "Key": "your-secret-key-minimum-32-characters-long",
    "Issuer": "TodoApp",
    "Audience": "TodoApp",
    "ExpiryMinutes": 60
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromEmail": "noreply@todoapp.com",
    "FromName": "TodoApp Notifications"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Frontend Configuration (`.env.production`)
```bash
REACT_APP_API_URL=https://your-api.azurewebsites.net/api
REACT_APP_ENV=production
REACT_APP_VERSION=2.0.0
```

---

## 🔧 Environment Variables

### Required Backend Variables
```bash
ConnectionStrings__DefaultConnection=your-azure-sql-connection
Jwt__Key=your-jwt-secret-key
EmailSettings__SmtpServer=smtp.gmail.com
EmailSettings__SmtpPort=587
EmailSettings__Username=your-email
EmailSettings__Password=your-app-password
```

### Required Frontend Variables
```bash
REACT_APP_API_URL=your-backend-api-url
REACT_APP_ENV=production
```

---

## 📈 Performance & Monitoring

### Backend Monitoring (Azure)
- **Application Insights**: Real-time performance tracking
- **Health Checks**: Automated endpoint monitoring
- **Logging**: Structured logging with Serilog
- **Error Tracking**: Exception handling and reporting

### Frontend Monitoring (Vercel)
- **Web Vitals**: Core web performance metrics
- **Analytics**: User interaction tracking
- **Error Boundary**: React error handling
- **Bundle Analysis**: Optimization insights

---

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Secure password hashing (BCrypt)
- Role-based access control
- Session management

### Data Protection
- HTTPS enforcement
- SQL injection prevention
- XSS protection
- CORS configuration

### Email Security
- SMTP authentication
- Rate limiting for emails
- Email validation
- Spam prevention

---

## 🚀 Future Enhancements

### Planned Features
- **Mobile App**: React Native implementation
- **Team Collaboration**: Shared tasks and workspaces
- **Advanced Analytics**: Productivity insights and reports
- **Task Categories**: Custom tags and categorization
- **Calendar Integration**: Google Calendar and Outlook sync
- **File Attachments**: Document and image uploads
- **Task Templates**: Reusable task structures
- **API Webhooks**: Third-party integrations

### Performance Improvements
- **Caching**: Redis implementation
- **Background Jobs**: Hangfire integration
- **Push Notifications**: Real-time updates
- **Offline Support**: Progressive Web App features

---

## 🤝 Contributing

### Development Workflow
```bash
# Fork the repository
git clone https://github.com/your-username/task-organizer.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push to branch
git push origin feature/amazing-feature

# Create Pull Request
```

### Code Standards
- **Backend**: Follow C# coding conventions
- **Frontend**: ESLint + Prettier configuration
- **Testing**: Unit tests for critical functionality
- **Documentation**: Update README for new features

---

## 📞 Support & Contact

### Getting Help
- **GitHub Issues**: [Report bugs and request features](https://github.com/Princearya34/task-organizer/issues)
- **Documentation**: Check this README and code comments
- **Email Support**: support@todoapp.com

### Developer Information
- **GitHub**: [@Princearya34](https://github.com/Princearya34)
- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/your-profile)
- **Portfolio**: [Your Portfolio Website](https://your-portfolio.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Microsoft Azure**: For reliable cloud hosting
- **Vercel**: For seamless frontend deployment
- **React Community**: For excellent documentation and support
- **ASP.NET Core Team**: For robust backend framework
- **Contributors**: Thanks to all who contributed to this project

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/Princearya34/task-organizer?style=social)](https://github.com/Princearya34/task-organizer/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Princearya34/task-organizer?style=social)](https://github.com/Princearya34/task-organizer/network/members)

</div>
