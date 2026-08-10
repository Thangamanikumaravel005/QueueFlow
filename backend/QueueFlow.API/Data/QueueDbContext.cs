using Microsoft.EntityFrameworkCore;
using QueueFlow.API.Models;

namespace QueueFlow.API.Data;

public class QueueDbContext : DbContext
{
    public QueueDbContext(
        DbContextOptions<QueueDbContext> options)
        : base(options)
    {
    }

    public DbSet<QueueItem> QueueItems { get; set; }

    public DbSet<User> Users { get; set; }
}