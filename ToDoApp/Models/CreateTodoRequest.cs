using System.ComponentModel.DataAnnotations;

namespace ToDoApp.Models
{
    public class CreateTodoRequest
    {
        [Required]
        [StringLength(500, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; } // New field

        public DateTime? DueDate { get; set; }

        public DateTime? ReminderDateTime { get; set; } // New field
    }
}