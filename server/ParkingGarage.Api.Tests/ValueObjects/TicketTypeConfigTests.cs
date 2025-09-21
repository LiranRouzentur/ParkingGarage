using FluentAssertions;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Tests.ValueObjects;

public class TicketTypeConfigTests
{
    [Theory]
    [InlineData(TicketType.VIP)]
    [InlineData(TicketType.Value)]
    [InlineData(TicketType.Regular)]
    public void GetConfig_ValidTicketType_ShouldReturnConfig(TicketType ticketType)
    {
        // Act
        var config = TicketTypeConfig.GetConfig(ticketType);

        // Assert
        config.Should().NotBeNull();
        config.Type.Should().Be(ticketType);
    }

    [Fact]
    public void GetConfig_InvalidTicketType_ShouldThrowArgumentException()
    {
        // Arrange
        var invalidTicketType = (TicketType)999;

        // Act & Assert
        var action = () => TicketTypeConfig.GetConfig(invalidTicketType);
        action.Should().Throw<ArgumentException>()
            .WithMessage($"Unknown ticket type: {invalidTicketType}");
    }

    [Fact]
    public void GetAllTicketTypes_ShouldReturnAllConfigurations()
    {
        // Act
        var allConfigs = TicketTypeConfig.GetAllTicketTypes();

        // Assert
        allConfigs.Should().HaveCount(3);
        allConfigs.Should().Contain(config => config.Type == TicketType.VIP);
        allConfigs.Should().Contain(config => config.Type == TicketType.Value);
        allConfigs.Should().Contain(config => config.Type == TicketType.Regular);
    }

    [Theory]
    [InlineData(VehicleType.Motorcycle, VehicleClass.A)]
    [InlineData(VehicleType.Private, VehicleClass.A)]
    [InlineData(VehicleType.Crossover, VehicleClass.A)]
    [InlineData(VehicleType.SUV, VehicleClass.B)]
    [InlineData(VehicleType.Van, VehicleClass.B)]
    [InlineData(VehicleType.Truck, VehicleClass.C)]
    public void GetVehicleClass_ValidVehicleType_ShouldReturnCorrectClass(VehicleType vehicleType, VehicleClass expectedClass)
    {
        // Act
        var vehicleClass = TicketTypeConfig.GetVehicleClass(vehicleType);

        // Assert
        vehicleClass.Should().Be(expectedClass);
    }

    [Fact]
    public void GetVehicleClass_InvalidVehicleType_ShouldThrowArgumentException()
    {
        // Arrange
        var invalidVehicleType = (VehicleType)999;

        // Act & Assert
        var action = () => TicketTypeConfig.GetVehicleClass(invalidVehicleType);
        action.Should().Throw<ArgumentException>()
            .WithMessage($"Unknown vehicle type: {invalidVehicleType}");
    }

    [Fact]
    public void VIP_Config_ShouldHaveCorrectProperties()
    {
        // Act
        var vipConfig = TicketTypeConfig.GetConfig(TicketType.VIP);

        // Assert
        vipConfig.Name.Should().Be("VIP");
        vipConfig.LotRange.Should().Be((1, 10));
        vipConfig.Cost.Should().Be(200m);
        vipConfig.TimeLimitHours.Should().BeNull();
        vipConfig.AllowedClasses.Should().Contain(VehicleClass.A);
        vipConfig.AllowedClasses.Should().Contain(VehicleClass.B);
        vipConfig.AllowedClasses.Should().Contain(VehicleClass.C);
        vipConfig.MaxDimensions.Should().Be((0, 0, 0));
    }

    [Fact]
    public void Value_Config_ShouldHaveCorrectProperties()
    {
        // Act
        var valueConfig = TicketTypeConfig.GetConfig(TicketType.Value);

        // Assert
        valueConfig.Name.Should().Be("Value");
        valueConfig.LotRange.Should().Be((11, 30));
        valueConfig.Cost.Should().Be(100m);
        valueConfig.TimeLimitHours.Should().Be(72);
        valueConfig.AllowedClasses.Should().Contain(VehicleClass.A);
        valueConfig.AllowedClasses.Should().Contain(VehicleClass.B);
        valueConfig.MaxDimensions.Should().Be((2.5m, 2.4m, 5.0m));
    }

    [Fact]
    public void Regular_Config_ShouldHaveCorrectProperties()
    {
        // Act
        var regularConfig = TicketTypeConfig.GetConfig(TicketType.Regular);

        // Assert
        regularConfig.Name.Should().Be("Regular");
        regularConfig.LotRange.Should().Be((31, 60));
        regularConfig.Cost.Should().Be(50m);
        regularConfig.TimeLimitHours.Should().Be(24);
        regularConfig.AllowedClasses.Should().Contain(VehicleClass.A);
        regularConfig.MaxDimensions.Should().Be((2.0m, 2.0m, 3.0m));
    }

    [Theory]
    [InlineData(2, 2.0, 2.0, 4.5, 1, true)] // Private, Fits VIP
    [InlineData(2, 2.0, 2.0, 4.5, 2, true)] // Private, Fits Value
    [InlineData(2, 2.0, 2.0, 4.5, 3, false)] // Private, Too long for Regular
    [InlineData(4, 2.5, 2.4, 5.0, 1, true)] // SUV, Fits VIP
    [InlineData(4, 2.5, 2.4, 5.0, 2, true)] // SUV, Fits Value
    [InlineData(4, 2.5, 2.4, 5.0, 3, false)] // SUV, Too big for Regular
    [InlineData(6, 3.0, 2.5, 6.0, 1, true)] // Truck, Fits VIP
    [InlineData(6, 3.0, 2.5, 6.0, 2, false)] // Truck, Too big for Value
    [InlineData(6, 3.0, 2.5, 6.0, 3, false)] // Truck, Too big for Regular
    public void IsVehicleCompatible_ShouldReturnCorrectResult(
        int vehicleTypeValue,
        double height,
        double width,
        double length,
        int ticketTypeValue,
        bool expectedResult)
    {
        // Arrange
        var vehicleType = (VehicleType)vehicleTypeValue;
        var ticketType = (TicketType)ticketTypeValue;
        var config = TicketTypeConfig.GetConfig(ticketType);

        // Act
        var result = config.IsVehicleCompatible(vehicleType, (decimal)height, (decimal)width, (decimal)length);

        // Assert
        result.Should().Be(expectedResult);
    }

    [Fact]
    public void GetCompatibleTicketTypes_ShouldReturnOnlyCompatibleTypes()
    {
        // Arrange
        var vehicleType = VehicleType.SUV;
        var height = 2.5m;
        var width = 2.4m;
        var length = 5.0m;

        // Act
        var compatibleTypes = TicketTypeConfig.GetCompatibleTicketTypes(vehicleType, height, width, length);

        // Assert
        compatibleTypes.Should().HaveCount(2);
        compatibleTypes.Should().Contain(config => config.Type == TicketType.VIP);
        compatibleTypes.Should().Contain(config => config.Type == TicketType.Value);
        compatibleTypes.Should().NotContain(config => config.Type == TicketType.Regular);
    }

    [Fact]
    public void FindSuitableTicketType_ShouldReturnCheapestCompatibleType()
    {
        // Arrange
        var vehicleType = VehicleType.Private;
        var height = 2.0m;
        var width = 2.0m;
        var length = 2.5m;

        // Act
        var suitableType = TicketTypeConfig.FindSuitableTicketType(vehicleType, height, width, length);

        // Assert
        suitableType.Should().NotBeNull();
        suitableType!.Type.Should().Be(TicketType.Regular); // Cheapest option that fits
        suitableType.Cost.Should().Be(50m);
    }

    [Fact]
    public void FindSuitableTicketType_PrivateVehicle_ShouldReturnRegular()
    {
        // Arrange - Use a vehicle type that's compatible with multiple ticket types
        var vehicleType = VehicleType.Private; // Private is Class A
        var height = 2.0m;
        var width = 2.0m;
        var length = 3.0m; // Fits Regular max length

        // Act - Find suitable type (should return Regular since it's the cheapest)
        var suitableType = TicketTypeConfig.FindSuitableTicketType(vehicleType, height, width, length);

        // Assert - Should return Regular since it's the cheapest compatible option
        suitableType.Should().NotBeNull();
        suitableType!.Type.Should().Be(TicketType.Regular);
        suitableType.Cost.Should().Be(50m);
    }

    [Theory]
    [InlineData(3, 2, 50.0)] // Regular to Value: 100 - 50 = 50
    [InlineData(3, 1, 150.0)] // Regular to VIP: 200 - 50 = 150
    [InlineData(2, 1, 100.0)] // Value to VIP: 200 - 100 = 100
    [InlineData(1, 1, 0.0)] // VIP to VIP: Same type, no upgrade cost
    public void GetUpgradeCost_ShouldCalculateCorrectCost(int currentTypeValue, int targetTypeValue, double expectedCost)
    {
        // Arrange
        var currentType = (TicketType)currentTypeValue;
        var targetType = (TicketType)targetTypeValue;
        var targetConfig = TicketTypeConfig.GetConfig(targetType);

        // Act
        var upgradeCost = targetConfig.GetUpgradeCost(currentType);

        // Assert
        upgradeCost.Should().Be((decimal)expectedCost);
    }
}
