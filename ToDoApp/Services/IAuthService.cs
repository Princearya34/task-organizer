using ToDoApp.Models;

namespace ToDoApp.Services
{
    public interface IAuthService
    {
        Task<AuthResponse?> RegisterAsync(RegisterRequest request);
        Task<AuthResponse?> LoginAsync(LoginRequest request);
        Task<User?> GetUserByIdAsync(int userId);
        Task<bool> UserExistsAsync(string username, string email);
    }
}