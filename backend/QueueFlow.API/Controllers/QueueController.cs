using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QueueFlow.API.Data;
using QueueFlow.API.Models;

namespace QueueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueueController : ControllerBase
{
    private readonly QueueDbContext _context;

    public QueueController(QueueDbContext context)
    {
        _context = context;
    }

    // ---------------------------------------------------------
    // CUSTOMER
    // Create a new queue token
    // POST: api/Queue
    // ---------------------------------------------------------
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> CreateQueueToken(
        [FromBody] CreateQueueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Service))
        {
            return BadRequest("Service is required.");
        }

        var lastToken = await _context.QueueItems
            .OrderByDescending(q => q.TokenNumber)
            .FirstOrDefaultAsync();

        int nextTokenNumber =
            lastToken == null
                ? 1
                : lastToken.TokenNumber + 1;

        var queueItem = new QueueItem
        {
            TokenNumber = nextTokenNumber,
            Service = request.Service,
            Status = "Waiting",
            CreatedAt = DateTime.UtcNow
        };

        _context.QueueItems.Add(queueItem);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Queue token generated successfully.",
            queue = queueItem
        });
    }

    // ---------------------------------------------------------
    // STAFF
    // Get all queue items
    // GET: api/Queue
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpGet]
    public async Task<IActionResult> GetQueue()
    {
        var queueItems = await _context.QueueItems
            .OrderBy(q => q.TokenNumber)
            .ToListAsync();

        return Ok(queueItems);
    }

    // ---------------------------------------------------------
    // STAFF
    // Get waiting customers
    // GET: api/Queue/waiting
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpGet("waiting")]
    public async Task<IActionResult> GetWaitingQueue()
    {
        var queueItems = await _context.QueueItems
            .Where(q => q.Status == "Waiting")
            .OrderBy(q => q.TokenNumber)
            .ToListAsync();

        return Ok(queueItems);
    }

    // ---------------------------------------------------------
    // STAFF
    // Get currently serving customer
    // GET: api/Queue/current
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentCustomer()
    {
        var currentCustomer = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Status == "Serving");

        return Ok(currentCustomer);
    }

    // ---------------------------------------------------------
    // STAFF
    // Call next customer
    // POST: api/Queue/next
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpPost("next")]
    public async Task<IActionResult> CallNextCustomer()
    {
        var currentCustomer = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Status == "Serving");

        if (currentCustomer != null)
        {
            return BadRequest(
                "A customer is already being served. Complete the current service first."
            );
        }

        var nextCustomer = await _context.QueueItems
            .Where(q => q.Status == "Waiting")
            .OrderBy(q => q.TokenNumber)
            .FirstOrDefaultAsync();

        if (nextCustomer == null)
        {
            return NotFound("No customers are waiting.");
        }

        nextCustomer.Status = "Serving";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Next customer called.",
            queue = nextCustomer
        });
    }

    // ---------------------------------------------------------
    // STAFF
    // Complete service
    // PUT: api/Queue/{id}/complete
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteService(int id)
    {
        var queueItem = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == id);

        if (queueItem == null)
        {
            return NotFound("Queue item not found.");
        }

        if (queueItem.Status != "Serving")
        {
            return BadRequest(
                "This customer is not currently being served."
            );
        }

        queueItem.Status = "Completed";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Service completed.",
            queue = queueItem
        });
    }

    // ---------------------------------------------------------
    // STAFF
    // Cancel queue
    // PUT: api/Queue/{id}/cancel
    // ---------------------------------------------------------
    [Authorize(Roles = "Staff")]
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelQueue(int id)
    {
        var queueItem = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == id);

        if (queueItem == null)
        {
            return NotFound("Queue item not found.");
        }

        if (queueItem.Status == "Completed")
        {
            return BadRequest(
                "A completed queue item cannot be cancelled."
            );
        }

        queueItem.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Queue item cancelled.",
            queue = queueItem
        });
    }
}

// Request model for creating a token
public class CreateQueueRequest
{
    public string Service { get; set; } = string.Empty;
}