using GameApi.Data;
using GameApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TranDauController : ControllerBase
{
    private readonly GameDbContext _context;

    public TranDauController(GameDbContext context)
    {
        _context = context;
    }

    // GET /api/trandau?CheDoChoi=Xếp hạng
    // Lấy danh sách trận đấu theo chế độ chơi (query parameter CheDoChoi).
    [HttpGet]
    public async Task<IActionResult> GetByCheDoChoi([FromQuery] string CheDoChoi)
    {
        if (string.IsNullOrWhiteSpace(CheDoChoi))
            return BadRequest("Thiếu tham số 'CheDoChoi'.");

        var cheDoChoi = CheDoChoi.Trim();
        var tranDaus = await _context.TranDaus
            .Where(t => t.CheDoChoi == cheDoChoi)
            .OrderByDescending(t => t.ThoiGianBatDau)
            .ThenBy(t => t.IDTranDau)
            .ToListAsync();

        return Ok(tranDaus);
    }
}
