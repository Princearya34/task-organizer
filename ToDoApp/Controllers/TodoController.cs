using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ToDoApp.Data;
using ToDoApp.Models;
using System.ComponentModel.DataAnnotations;

namespace ToDoApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints
    public class TodoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TodoController> _logger;

        public TodoController(AppDbContext context, ILogger<TodoController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        // GET: api/todo
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var userId = GetCurrentUserId();
                var items = await _context.TodoItems
                    .Where(x => x.UserId == userId)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();
                return Ok(items);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todos");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/todo/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var item = await _context.TodoItems
                    .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
                
                if (item == null)
                    return NotFound();
                
                return Ok(item);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todo {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/todo/filter?completed=true&dueDate=2025-07-10
        [HttpGet("filter")]
        public async Task<IActionResult> Filter(bool? completed = null, DateTime? dueDate = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var query = _context.TodoItems
                    .Where(x => x.UserId == userId)
                    .AsQueryable();

                if (completed.HasValue)
                    query = query.Where(x => x.IsCompleted == completed.Value);

                if (dueDate.HasValue)
                    query = query.Where(x => x.DueDate.HasValue && x.DueDate.Value.Date == dueDate.Value.Date);

                var result = await query
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();
                
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering todos");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/todo/summary
        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            try
            {
                var userId = GetCurrentUserId();
                var total = await _context.TodoItems.CountAsync(x => x.UserId == userId);
                var completed = await _context.TodoItems.CountAsync(x => x.UserId == userId && x.IsCompleted);
                var pending = total - completed;

                return Ok(new { total, completed, pending });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting todo summary");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/todo
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTodoRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetCurrentUserId();
                var item = new TodoItem
                {
                    Title = request.Title.Trim(),
                    DueDate = request.DueDate,
                    IsCompleted = false,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.TodoItems.Add(item);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating todo");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/todo/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoRequest request)
        {
            try
            {
                if (id != request.Id)
                    return BadRequest("ID mismatch");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetCurrentUserId();
                var item = await _context.TodoItems
                    .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

                if (item == null)
                    return NotFound();

                item.Title = request.Title.Trim();
                item.DueDate = request.DueDate;
                item.IsCompleted = request.IsCompleted;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating todo {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/todo/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var item = await _context.TodoItems
                    .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

                if (item == null)
                    return NotFound();

                _context.TodoItems.Remove(item);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting todo {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PATCH: api/todo/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleCompleted(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var item = await _context.TodoItems
                    .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

                if (item == null)
                    return NotFound();

                item.IsCompleted = !item.IsCompleted;
                await _context.SaveChangesAsync();
                return Ok(item);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling todo {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}

// Additional request models for better validation
namespace ToDoApp.Models
{
    public class CreateTodoRequest
    {
        [Required]
        [StringLength(500, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;
        
        public DateTime? DueDate { get; set; }
    }

    public class UpdateTodoRequest
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(500, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;
        
        public DateTime? DueDate { get; set; }
        
        public bool IsCompleted { get; set; }
    }
}