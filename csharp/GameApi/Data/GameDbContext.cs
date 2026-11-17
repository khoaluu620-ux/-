using GameApi.Models;
using Microsoft.EntityFrameworkCore;

namespace GameApi.Data;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

    public DbSet<TranDau> TranDaus => Set<TranDau>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TranDau>(entity =>
        {
            entity.ToTable("TranDau");
            entity.HasKey(e => e.IDTranDau);
            entity.Property(e => e.IDTranDau).HasColumnName("IDTranDau");
            entity.Property(e => e.CheDoChoi).HasColumnName("CheDoChoi");
            entity.Property(e => e.ThoiGianBatDau).HasColumnName("ThoiGianBatDau");
            entity.Property(e => e.ThoiGianKetThuc).HasColumnName("ThoiGianKetThuc");
        });
    }
}
