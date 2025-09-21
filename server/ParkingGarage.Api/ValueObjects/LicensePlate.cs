using System.Text.RegularExpressions;

namespace ParkingGarage.Api.ValueObjects;

public class LicensePlate
{
    public string Value { get; }

    private LicensePlate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("License plate cannot be null or empty", nameof(value));

        // Basic validation - can be enhanced based on specific country/region requirements
        var cleanedValue = value.Trim().ToUpperInvariant();

        if (cleanedValue.Length < 2 || cleanedValue.Length > 10)
            throw new ArgumentException("License plate must be between 2 and 10 characters", nameof(value));

        // Allow alphanumeric characters, spaces, and common separators
        if (!Regex.IsMatch(cleanedValue, @"^[A-Z0-9\s\-\.]+$"))
            throw new ArgumentException("License plate contains invalid characters", nameof(value));

        Value = cleanedValue;
    }

    public static LicensePlate Create(string value)
    {
        return new LicensePlate(value);
    }

    public override string ToString()
    {
        return Value;
    }

    public static implicit operator string(LicensePlate licensePlate)
    {
        return licensePlate.Value;
    }

    public static implicit operator LicensePlate(string value)
    {
        return Create(value);
    }

    /// <summary>
    /// Creates a LicensePlate for EF Core materialization (bypasses validation)
    /// </summary>
    public static LicensePlate ForEfCore(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            value = "TEMP123";

        return new LicensePlate(value);
    }

    public override bool Equals(object? obj)
    {
        return obj is LicensePlate other && Value == other.Value;
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public static bool operator ==(LicensePlate left, LicensePlate right)
    {
        return left?.Value == right?.Value;
    }

    public static bool operator !=(LicensePlate left, LicensePlate right)
    {
        return !(left == right);
    }
}
