using System.Security.Claims;
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

    // =========================================================
    // GET: api/Queue
    // Admin / Staff
    // Get all queue items
    // =========================================================

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetQueue()
    {
        var queue = await _context.QueueItems
            .OrderBy(q => q.TokenNumber)
            .Select(q => new
            {
                q.Id,
                q.TokenNumber,
                q.Service,
                q.Status,
                q.CreatedAt,
                q.CustomerId
            })
            .ToListAsync();

        return Ok(queue);
    }


    // =========================================================
    // GET: api/Queue/my-token
    // Customer
    // Get logged-in customer's latest token
    // =========================================================

    [HttpGet("my-token")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetMyToken()
    {
        var customerIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(
                customerIdClaim) ||
            !int.TryParse(
                customerIdClaim,
                out int customerId))
        {
            return Unauthorized(
                "Customer identity not found."
            );
        }

        var myToken = await _context.QueueItems
            .Where(q =>
                q.CustomerId == customerId)
            .OrderByDescending(q =>
                q.CreatedAt)
            .FirstOrDefaultAsync();

        if (myToken == null)
        {
            return NotFound(
                "You do not have a queue token."
            );
        }

        var peopleAhead = 0;

        if (myToken.Status.Equals(
                "Waiting",
                StringComparison.OrdinalIgnoreCase))
        {
            peopleAhead =
                await _context.QueueItems
                    .CountAsync(q =>
                        q.Status == "Waiting" &&
                        q.TokenNumber <
                        myToken.TokenNumber);
        }

        var estimatedWaitMinutes =
            peopleAhead * 5;

        return Ok(new
        {
            id = myToken.Id,
            tokenNumber =
                myToken.TokenNumber,
            service =
                myToken.Service,
            status =
                myToken.Status,
            createdAt =
                myToken.CreatedAt,
            customerId =
                myToken.CustomerId,
            peopleAhead,
            estimatedWaitMinutes
        });
    }


    // =========================================================
    // POST: api/Queue
    // Customer
    // Generate new queue token
    // =========================================================

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateQueue(
        [FromBody] CreateQueueRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(
                request.Service))
        {
            return BadRequest(
                "Service is required."
            );
        }

        var customerIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(
                customerIdClaim) ||
            !int.TryParse(
                customerIdClaim,
                out int customerId))
        {
            return Unauthorized(
                "Customer identity not found."
            );
        }

        // Prevent multiple active tokens
        var existingToken =
            await _context.QueueItems
                .FirstOrDefaultAsync(q =>
                    q.CustomerId == customerId &&
                    (
                        q.Status == "Waiting" ||
                        q.Status == "Serving"
                    ));

        if (existingToken != null)
        {
            return Conflict(new
            {
                message =
                    "You already have an active queue token.",

                queue = new
                {
                    existingToken.Id,
                    existingToken.TokenNumber,
                    existingToken.Service,
                    existingToken.Status,
                    existingToken.CreatedAt,
                    existingToken.CustomerId
                }
            });
        }

        // Generate next token number
        var lastToken =
            await _context.QueueItems
                .OrderByDescending(q =>
                    q.TokenNumber)
                .FirstOrDefaultAsync();

        var nextTokenNumber =
            lastToken == null
                ? 1
                : lastToken.TokenNumber + 1;

        var queueItem = new QueueItem
        {
            TokenNumber =
                nextTokenNumber,

            Service =
                request.Service.Trim(),

            Status =
                "Waiting",

            CreatedAt =
                DateTime.UtcNow,

            CustomerId =
                customerId
        };

        _context.QueueItems.Add(
            queueItem);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Queue token generated successfully.",

            queue = new
            {
                queueItem.Id,
                queueItem.TokenNumber,
                queueItem.Service,
                queueItem.Status,
                queueItem.CreatedAt,
                queueItem.CustomerId
            }
        });
    }


    // =========================================================
    // POST: api/Queue/next
    // Staff
    // Call next customer from ALL services
    // =========================================================

    [HttpPost("next")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> CallNext()
    {
        var currentServing =
            await _context.QueueItems
                .FirstOrDefaultAsync(q =>
                    q.Status == "Serving");

        if (currentServing != null)
        {
            return Conflict(new
            {
                message =
                    "A customer is already being served.",

                queue = new
                {
                    currentServing.Id,
                    currentServing.TokenNumber,
                    currentServing.Service,
                    currentServing.Status,
                    currentServing.CreatedAt,
                    currentServing.CustomerId
                }
            });
        }

        var nextCustomer =
            await _context.QueueItems
                .Where(q =>
                    q.Status == "Waiting")
                .OrderBy(q =>
                    q.CreatedAt)
                .ThenBy(q =>
                    q.TokenNumber)
                .FirstOrDefaultAsync();

        if (nextCustomer == null)
        {
            return NotFound(new
            {
                message =
                    "No customers are waiting."
            });
        }

        nextCustomer.Status =
            "Serving";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Next customer is now being served.",

            queue = new
            {
                nextCustomer.Id,
                nextCustomer.TokenNumber,
                nextCustomer.Service,
                nextCustomer.Status,
                nextCustomer.CreatedAt,
                nextCustomer.CustomerId
            }
        });
    }


    // =========================================================
    // POST: api/Queue/next-by-service
    // Staff
    // Call next customer for selected service
    // =========================================================

    [HttpPost("next-by-service")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> CallNextByService(
        [FromBody] NextServiceRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(
                request.Service))
        {
            return BadRequest(
                "Service is required."
            );
        }

        var service =
            request.Service.Trim();

        // Only one serving customer
        // in the current project
        var currentServing =
            await _context.QueueItems
                .FirstOrDefaultAsync(q =>
                    q.Status == "Serving");

        if (currentServing != null)
        {
            return Conflict(new
            {
                message =
                    "A customer is already being served.",

                queue = new
                {
                    currentServing.Id,
                    currentServing.TokenNumber,
                    currentServing.Service,
                    currentServing.Status,
                    currentServing.CreatedAt,
                    currentServing.CustomerId
                }
            });
        }

        // Find oldest waiting customer
        // for selected service
        var nextCustomer =
            await _context.QueueItems
                .Where(q =>
                    q.Status == "Waiting" &&
                    q.Service == service)
                .OrderBy(q =>
                    q.CreatedAt)
                .ThenBy(q =>
                    q.TokenNumber)
                .FirstOrDefaultAsync();

        if (nextCustomer == null)
        {
            return NotFound(new
            {
                message =
                    $"No customers are waiting for {service}."
            });
        }

        nextCustomer.Status =
            "Serving";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                $"Next {service} customer is now being served.",

            queue = new
            {
                nextCustomer.Id,
                nextCustomer.TokenNumber,
                nextCustomer.Service,
                nextCustomer.Status,
                nextCustomer.CreatedAt,
                nextCustomer.CustomerId
            }
        });
    }


    // =========================================================
    // PUT: api/Queue/{id}/complete
    // Staff
    // Complete current service
    // =========================================================

    [HttpPut("{id:int}/complete")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Complete(
        int id)
    {
        var queueItem =
            await _context.QueueItems
                .FirstOrDefaultAsync(q =>
                    q.Id == id);

        if (queueItem == null)
        {
            return NotFound(
                "Queue item not found."
            );
        }

        if (!queueItem.Status.Equals(
                "Serving",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                "Only a serving token can be completed."
            );
        }

        queueItem.Status =
            "Completed";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Service completed successfully.",

            queue = new
            {
                queueItem.Id,
                queueItem.TokenNumber,
                queueItem.Service,
                queueItem.Status,
                queueItem.CreatedAt,
                queueItem.CustomerId
            }
        });
    }


    // =========================================================
    // PUT: api/Queue/{id}/cancel
    // Staff
    // Cancel waiting token
    // =========================================================

    [HttpPut("{id:int}/cancel")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Cancel(
        int id)
    {
        var queueItem =
            await _context.QueueItems
                .FirstOrDefaultAsync(q =>
                    q.Id == id);

        if (queueItem == null)
        {
            return NotFound(
                "Queue item not found."
            );
        }

        if (!queueItem.Status.Equals(
                "Waiting",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                "Only a waiting token can be cancelled."
            );
        }

        queueItem.Status =
            "Cancelled";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Queue token cancelled successfully.",

            queue = new
            {
                queueItem.Id,
                queueItem.TokenNumber,
                queueItem.Service,
                queueItem.Status,
                queueItem.CreatedAt,
                queueItem.CustomerId
            }
        });
    }
}


// =============================================================
// Request Models
// =============================================================

public class CreateQueueRequest
{
    public string Service { get; set; } =
        string.Empty;
}


public class NextServiceRequest
{
    public string Service { get; set; } =
        string.Empty;
}