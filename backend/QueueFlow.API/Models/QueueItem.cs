namespace QueueFlow.API.Models;

public class QueueItem
{
    public int Id { get; set; }

    public int TokenNumber { get; set; }

    public string Service { get; set; } = string.Empty;

    public string Status { get; set; } = "Waiting";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}