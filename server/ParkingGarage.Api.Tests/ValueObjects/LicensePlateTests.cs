using FluentAssertions;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Tests.ValueObjects;

public class LicensePlateTests
{
    [Theory]
    [InlineData("ABC-123")]
    [InlineData("XYZ 789")]
    [InlineData("DEF456")]
    [InlineData("A1B2C3")]
    [InlineData("TEST.PLATE")]
    [InlineData("abc-123")] // Should be converted to uppercase
    public void Create_ValidLicensePlate_ShouldCreateSuccessfully(string input)
    {
        // Act
        var licensePlate = LicensePlate.Create(input);

        // Assert
        licensePlate.Should().NotBeNull();
        licensePlate.Value.Should().Be(input.Trim().ToUpperInvariant());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData("\n")]
    public void Create_InvalidInput_ShouldThrowArgumentException(string? input)
    {
        // Act & Assert
        var action = () => LicensePlate.Create(input!);
        action.Should().Throw<ArgumentException>()
            .WithMessage("License plate cannot be null or empty*");
    }

    [Theory]
    [InlineData("A")] // Too short
    [InlineData("12345678901")] // Too long
    public void Create_InvalidLength_ShouldThrowArgumentException(string input)
    {
        // Act & Assert
        var action = () => LicensePlate.Create(input);
        action.Should().Throw<ArgumentException>()
            .WithMessage("License plate must be between 2 and 10 characters*");
    }

    [Theory]
    [InlineData("ABC@123")] // Invalid character @
    [InlineData("ABC#123")] // Invalid character #
    [InlineData("ABC$123")] // Invalid character $
    [InlineData("ABC%123")] // Invalid character %
    [InlineData("ABC!123")] // Invalid character !
    public void Create_InvalidCharacters_ShouldThrowArgumentException(string input)
    {
        // Act & Assert
        var action = () => LicensePlate.Create(input);
        action.Should().Throw<ArgumentException>()
            .WithMessage("License plate contains invalid characters*");
    }

    [Fact]
    public void ToString_ShouldReturnValue()
    {
        // Arrange
        var licensePlate = LicensePlate.Create("ABC-123");

        // Act
        var result = licensePlate.ToString();

        // Assert
        result.Should().Be("ABC-123");
    }

    [Fact]
    public void ImplicitConversion_ToString_ShouldWork()
    {
        // Arrange
        var licensePlate = LicensePlate.Create("ABC-123");

        // Act
        string result = licensePlate;

        // Assert
        result.Should().Be("ABC-123");
    }

    [Fact]
    public void ImplicitConversion_FromString_ShouldWork()
    {
        // Act
        LicensePlate licensePlate = "ABC-123";

        // Assert
        licensePlate.Value.Should().Be("ABC-123");
    }

    [Fact]
    public void ForEfCore_WithValidValue_ShouldCreateSuccessfully()
    {
        // Act
        var licensePlate = LicensePlate.ForEfCore("ABC-123");

        // Assert
        licensePlate.Value.Should().Be("ABC-123");
    }

    [Fact]
    public void ForEfCore_WithNullValue_ShouldUseDefaultValue()
    {
        // Act
        var licensePlate = LicensePlate.ForEfCore(null!);

        // Assert
        licensePlate.Value.Should().Be("TEMP123");
    }

    [Fact]
    public void ForEfCore_WithEmptyValue_ShouldUseDefaultValue()
    {
        // Act
        var licensePlate = LicensePlate.ForEfCore("");

        // Assert
        licensePlate.Value.Should().Be("TEMP123");
    }

    [Fact]
    public void Equals_WithSameValue_ShouldReturnTrue()
    {
        // Arrange
        var licensePlate1 = LicensePlate.Create("ABC-123");
        var licensePlate2 = LicensePlate.Create("ABC-123");

        // Act & Assert
        licensePlate1.Should().Be(licensePlate2);
        licensePlate1.GetHashCode().Should().Be(licensePlate2.GetHashCode());
    }

    [Fact]
    public void Equals_WithDifferentValue_ShouldReturnFalse()
    {
        // Arrange
        var licensePlate1 = LicensePlate.Create("ABC-123");
        var licensePlate2 = LicensePlate.Create("XYZ-789");

        // Act & Assert
        licensePlate1.Should().NotBe(licensePlate2);
    }

    [Fact]
    public void Equals_WithNull_ShouldReturnFalse()
    {
        // Arrange
        var licensePlate = LicensePlate.Create("ABC-123");

        // Act & Assert
        licensePlate.Should().NotBe(null);
    }

    [Fact]
    public void EqualityOperator_WithSameValue_ShouldReturnTrue()
    {
        // Arrange
        var licensePlate1 = LicensePlate.Create("ABC-123");
        var licensePlate2 = LicensePlate.Create("ABC-123");

        // Act & Assert
        (licensePlate1 == licensePlate2).Should().BeTrue();
        (licensePlate1 != licensePlate2).Should().BeFalse();
    }

    [Fact]
    public void EqualityOperator_WithDifferentValue_ShouldReturnFalse()
    {
        // Arrange
        var licensePlate1 = LicensePlate.Create("ABC-123");
        var licensePlate2 = LicensePlate.Create("XYZ-789");

        // Act & Assert
        (licensePlate1 == licensePlate2).Should().BeFalse();
        (licensePlate1 != licensePlate2).Should().BeTrue();
    }

    [Fact]
    public void EqualityOperator_WithNull_ShouldHandleCorrectly()
    {
        // Arrange
        var licensePlate = LicensePlate.Create("ABC-123");

        // Act & Assert
        (licensePlate == null).Should().BeFalse();
        (licensePlate != null).Should().BeTrue();
        (null == licensePlate).Should().BeFalse();
        (null != licensePlate).Should().BeTrue();
    }
}
