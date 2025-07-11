using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToDoApp.Data;
using ToDoApp.Models;

namespace ToDoApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TodoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/todo
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.TodoItems.ToListAsync();
            return Ok(items);
        }

        // GET: api/todo/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.TodoItems.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        // GET: api/todo/filter?completed=true&dueDate=2025-07-10
        [HttpGet("filter")]
        public async Task<IActionResult> Filter(bool? completed = null, DateTime? dueDate = null)
        {
            var query = _context.TodoItems.AsQueryable();

            if (completed.HasValue)
                query = query.Where(x => x.IsCompleted == completed.Value);

            if (dueDate.HasValue)
                query = query.Where(x => x.DueDate.HasValue && x.DueDate.Value.Date == dueDate.Value.Date);

            var result = await query.ToListAsync();
            return Ok(result);
        }

        // GET: api/todo/summary
        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var total = await _context.TodoItems.CountAsync();
            var completed = await _context.TodoItems.CountAsync(x => x.IsCompleted);
            var pending = total - completed;

            return Ok(new { total, completed, pending });
        }

        // POST: api/todo
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TodoItem item)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            item.IsCompleted = false;
            _context.TodoItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        // PUT: api/todo/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TodoItem item)
        {
            if (id != item.Id) return BadRequest();

            _context.TodoItems.Update(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/todo/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.TodoItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.TodoItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH: api/todo/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleCompleted(int id)
        {
            var item = await _context.TodoItems.FindAsync(id);
            if (item == null) return NotFound();

            item.IsCompleted = !item.IsCompleted;
            await _context.SaveChangesAsync();
            return Ok(item);
        }
    }
}
