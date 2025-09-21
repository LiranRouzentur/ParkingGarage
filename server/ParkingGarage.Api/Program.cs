using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Interfaces;
using ParkingGarage.Api.Services;
using ParkingGarage.Api.Data;
using ParkingGarage.Api;
using Serilog;

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================
var logDirectory = "logs";
if (!Directory.Exists(logDirectory))
{
    Directory.CreateDirectory(logDirectory);
}

var logFilePath = Path.Combine(logDirectory, "parking-garage.txt");
if (File.Exists(logFilePath))
{
    File.Delete(logFilePath);
}

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File(logFilePath,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

// ============================================================================
// APPLICATION BUILDER CONFIGURATION
// ============================================================================
var builder = WebApplication.CreateBuilder(args);

// Add Serilog
builder.Host.UseSerilog();

// ============================================================================
// SERVICES CONFIGURATION
// ============================================================================
// Core services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS configuration for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Primary DbContext
builder.Services.AddDbContext<ParkingGarageDbContext>(options =>
    options.UseSqlServer(connectionString));

// DbContextFactory for concurrent operations
builder.Services.AddDbContextFactory<ParkingGarageDbContext>(options =>
    options.UseSqlServer(connectionString),
    ServiceLifetime.Scoped);

// ============================================================================
// APPLICATION SERVICES
// ============================================================================
// Core business services
builder.Services.AddScoped<IParkingService, ParkingService>();
builder.Services.AddScoped<ILoggingService, LoggingService>();

// Note: RandomDataGenerator, LotManagementService, and VehicleManagementService 
// are static utility classes and don't need DI registration

var app = builder.Build();

// ============================================================================
// HTTP REQUEST PIPELINE CONFIGURATION
// ============================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// ============================================================================
// DATABASE INITIALIZATION AND SEEDING
// ============================================================================
// Ensure database is created and seed data
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ParkingGarageDbContext>();

        // Drop and recreate database for fresh start
        Console.WriteLine("Dropping existing database...");
        context.Database.EnsureDeleted();
        Console.WriteLine("Database dropped successfully!");

        Console.WriteLine("Creating fresh database...");
        context.Database.EnsureCreated();
        Console.WriteLine("Database created successfully!");

        // Create stored procedures from external SQL files
        Console.WriteLine("Creating stored procedures...");
        await DatabaseInitializer.CreateStoredProceduresAsync(context);
        Console.WriteLine("Stored procedures created successfully!");

        // Seed initial data
        Console.WriteLine("Seeding data...");
        DataSeeding.SeedDataAsync(context).Wait();
        Console.WriteLine("Data seeded successfully!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error during database setup: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    // Continue with app startup even if database setup fails
}

// ============================================================================
// START APPLICATION
// ============================================================================
app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
