using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services.Email;

public interface IEmailNotificationService
{
    Task SendTicketCreatedNotificationAsync(Ticket ticket);
    Task SendTicketReplyNotificationAsync(Ticket ticket, TicketMessage message);
    Task SendSlaBreachWarningAsync(Ticket ticket);
}
