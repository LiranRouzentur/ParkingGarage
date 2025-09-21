using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;

namespace ParkingGarage.Api.Data;

public class ParkingGarageDbContext : DbContext
{
    public ParkingGarageDbContext(DbContextOptions<ParkingGarageDbContext> options) : base(options)
    {
    }

    public DbSet<ParkingLot> ParkingLots { get; set; }
    public DbSet<ParkedVehicle> ParkedVehicles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure ParkingLot entity
        modelBuilder.Entity<ParkingLot>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.LotNumber)
                .IsRequired();

            entity.Property(x => x.TicketType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(x => x.Status)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(x => x.VehicleId)
                .IsRequired(false);

            entity.HasIndex(x => x.LotNumber)
                .IsUnique();

            entity.HasOne(x => x.Vehicle)
                .WithMany()
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure ParkedVehicle entity
        modelBuilder.Entity<ParkedVehicle>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.OwnsOne(x => x.LicensePlate, licensePlate =>
            {
                licensePlate.Property(lp => lp.Value)
                    .HasColumnName("LicensePlate")
                    .HasMaxLength(20)
                    .IsRequired();

                licensePlate.HasIndex(lp => lp.Value)
                    .IsUnique();
            });

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Phone)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.TicketType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(x => x.VehicleType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(x => x.Height)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(x => x.Width)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(x => x.Length)
                .HasPrecision(10, 2)
                .IsRequired();

            entity.Property(x => x.LotNumber)
                .IsRequired();

            entity.Property(x => x.CheckInTime)
                .IsRequired();

            entity.Property(x => x.CheckOutTime)
                .IsRequired(false);

            entity.Property(x => x.TotalCost)
                .HasPrecision(10, 2)
                .IsRequired();
        });
    }
}
