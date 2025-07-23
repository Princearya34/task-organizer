using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using ToDoApp.Data;
using ToDoApp.Models;

public class ReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReminderBackgroundService> _logger;

    // You may want to inject your config or secrets for production use.
    private const string GmailAddress = "aryaprince617@gmail.com"; // <-- your Gmail address
    private const string GmailAppPassword = "bxnleikfvxmcvtlv"; // <-- your App Password

    public ReminderBackgroundService(IServiceProvider serviceProvider, ILogger<ReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var now = DateTime.UtcNow;
                    var reminders = await db.TodoItems
                        .Include(t => t.User)
                        .Where(t => t.ReminderDateTime.HasValue
                                    && t.ReminderDateTime <= now
                                    && !t.IsCompleted)
                        .ToListAsync(stoppingToken);

                    foreach (var todo in reminders)
                    {
                        if (!string.IsNullOrWhiteSpace(todo.User?.Email))
                        {
                            SendReminderEmail(todo.User.Email, todo.Title, todo.Description);
                        }
                        todo.ReminderDateTime = null;
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ReminderBackgroundService");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private void SendReminderEmail(string toEmail, string title, string? description)
    {
        var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(GmailAddress, GmailAppPassword),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(GmailAddress),
            Subject = $"Reminder: {title}",
            Body = $"Task: {title}\n\n{description}",
            IsBodyHtml = false,
        };
        mailMessage.To.Add(toEmail);

        smtpClient.Send(mailMessage);
    }
}