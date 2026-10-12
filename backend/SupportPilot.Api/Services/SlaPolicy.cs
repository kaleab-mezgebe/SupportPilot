using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services;

public static class SlaPolicy
{
    /// <summary>
    /// Returns default SLA targets (FirstResponseTarget, ResolutionTarget) based on priority.
    /// Urgent: 1 hr response / 4 hr resolution
    /// High:   4 hr response / 12 hr resolution
    /// Medium: 8 hr response / 24 hr resolution
    /// Low:    24 hr response / 72 hr resolution
    /// </summary>
    public static (TimeSpan FirstResponseTarget, TimeSpan ResolutionTarget) GetTargets(TicketPriority priority) =>
        priority switch
        {
            TicketPriority.Urgent => (TimeSpan.FromHours(1), TimeSpan.FromHours(4)),
            TicketPriority.High   => (TimeSpan.FromHours(4), TimeSpan.FromHours(12)),
            TicketPriority.Medium => (TimeSpan.FromHours(8), TimeSpan.FromHours(24)),
            TicketPriority.Low    => (TimeSpan.FromHours(24), TimeSpan.FromHours(72)),
            _                     => (TimeSpan.FromHours(8), TimeSpan.FromHours(24))
        };

    /// <summary>
    /// Computes and applies SLA deadline timestamps when a ticket is created or prioritized.
    /// </summary>
    public static void ApplySlaTargets(Ticket ticket)
    {
        var (firstResponse, resolution) = GetTargets(ticket.Priority);
        ticket.FirstResponseDueAtUtc = ticket.CreatedAtUtc.Add(firstResponse);
        ticket.ResolutionDueAtUtc = ticket.CreatedAtUtc.Add(resolution);
    }

    /// <summary>
    /// Checks if a ticket currently breaches SLA based on current UTC timestamp.
    /// </summary>
    public static bool EvaluateBreach(Ticket ticket, DateTime nowUtc)
    {
        if (ticket.IsSlaBreached) return true;

        // 1. First Response Breach: No agent response yet and first response due date has passed
        if (ticket.FirstResponseAtUtc == null && 
            ticket.FirstResponseDueAtUtc.HasValue && 
            nowUtc > ticket.FirstResponseDueAtUtc.Value &&
            ticket.Status != TicketStatus.Resolved &&
            ticket.Status != TicketStatus.Closed)
        {
            return true;
        }

        // 2. Active Resolution Breach: Ticket not resolved and resolution deadline passed
        if (ticket.Status != TicketStatus.Resolved && 
            ticket.Status != TicketStatus.Closed &&
            ticket.ResolutionDueAtUtc.HasValue && 
            nowUtc > ticket.ResolutionDueAtUtc.Value)
        {
            return true;
        }

        // 3. Post-Resolution Breach: Resolved timestamp was after the resolution due date
        if (ticket.ResolvedAtUtc.HasValue && 
            ticket.ResolutionDueAtUtc.HasValue && 
            ticket.ResolvedAtUtc.Value > ticket.ResolutionDueAtUtc.Value)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Records first agent reply timestamp and updates breach flag if breached.
    /// </summary>
    public static void RecordFirstResponse(Ticket ticket, DateTime responseTimeUtc)
    {
        if (ticket.FirstResponseAtUtc == null)
        {
            ticket.FirstResponseAtUtc = responseTimeUtc;
            if (ticket.FirstResponseDueAtUtc.HasValue && responseTimeUtc > ticket.FirstResponseDueAtUtc.Value)
            {
                ticket.IsSlaBreached = true;
            }
        }
    }

    /// <summary>
    /// Records resolution timestamp and updates breach flag if breached.
    /// </summary>
    public static void RecordResolution(Ticket ticket, DateTime resolutionTimeUtc)
    {
        ticket.ResolvedAtUtc = resolutionTimeUtc;
        if (ticket.ResolutionDueAtUtc.HasValue && resolutionTimeUtc > ticket.ResolutionDueAtUtc.Value)
        {
            ticket.IsSlaBreached = true;
        }
    }

    /// <summary>
    /// Recalculates due dates if priority changes during ticket triage.
    /// </summary>
    public static void RecalculateForPriority(Ticket ticket, TicketPriority newPriority)
    {
        ticket.Priority = newPriority;
        var (firstResp, resolution) = GetTargets(newPriority);
        ticket.FirstResponseDueAtUtc = ticket.CreatedAtUtc.Add(firstResp);
        ticket.ResolutionDueAtUtc = ticket.CreatedAtUtc.Add(resolution);
        ticket.IsSlaBreached = EvaluateBreach(ticket, DateTime.UtcNow);
    }
}
