"""Tests for the Revenue Adjustment Factor (RAF) calculator service."""

from services.raf import _calculate_average_revenue, calc_raf


class TestRAF:
    """Test cases for the RAF calculator."""

    def test_positive_revenue_change(self):
        """Test RAF calculation with positive revenue change."""
        # Mock data with +10% revenue change
        # Y0: 3000, Y-1: 2800, Y-2: 2600, Y-3: 2400
        # Recent avg (Y0, Y-1, Y-2): 2800
        # Older avg (Y-1, Y-2, Y-3): 2600
        # Change: (2800 - 2600) / 2600 = 0.0769 (7.69%)
        # RAF: 1 + (0.0769 * 0.20) = 1.01538 -> 1.0154
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 2500,
                "performance_fees": 500,
            },  # Y0: 3000
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2300,
                "performance_fees": 500,
            },  # Y-1: 2800
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2100,
                "performance_fees": 500,
            },  # Y-2: 2600
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 1900,
                "performance_fees": 500,
            },  # Y-3: 2400
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 1.0154
        assert round(raf, 4) == 1.0154

    def test_negative_revenue_change(self):
        """Test RAF calculation with negative revenue change."""
        # Mock data with -5% revenue change
        # Y0: 2400, Y-1: 2500, Y-2: 2600, Y-3: 2700
        # Recent avg (Y0, Y-1, Y-2): 2500
        # Older avg (Y-1, Y-2, Y-3): 2600
        # Change: (2500 - 2600) / 2600 = -0.0385 (-3.85%)
        # RAF: 1 + (-0.0385 * 0.20) = 0.9923
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 2000,
                "performance_fees": 400,
            },  # Y0: 2400
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2100,
                "performance_fees": 400,
            },  # Y-1: 2500
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2200,
                "performance_fees": 400,
            },  # Y-2: 2600
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 2300,
                "performance_fees": 400,
            },  # Y-3: 2700
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 0.9923
        assert round(raf, 4) == 0.9923

    def test_zero_revenue_change(self):
        """Test RAF calculation with zero revenue change."""
        # Mock data with 0% revenue change
        # Y0: 2500, Y-1: 2500, Y-2: 2500, Y-3: 2500
        # Recent avg (Y0, Y-1, Y-2): 2500
        # Older avg (Y-1, Y-2, Y-3): 2500
        # Change: (2500 - 2500) / 2500 = 0
        # RAF: 1 + (0 * 0.20) = 1.0
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 2100,
                "performance_fees": 400,
            },  # Y0: 2500
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2100,
                "performance_fees": 400,
            },  # Y-1: 2500
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2100,
                "performance_fees": 400,
            },  # Y-2: 2500
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 2100,
                "performance_fees": 400,
            },  # Y-3: 2500
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 1.0
        assert round(raf, 4) == 1.0

    def test_raf_upper_limit(self):
        """Test RAF calculation with large positive change that exceeds the upper limit."""
        # Mock data with +60% revenue change
        # Y0: 4000, Y-1: 3000, Y-2: 2500, Y-3: 2000
        # Recent avg (Y0, Y-1, Y-2): 3167
        # Older avg (Y-1, Y-2, Y-3): 2500
        # Change: (3167 - 2500) / 2500 = 0.2668 (26.68%)
        # RAF before clamping: 1 + (0.2668 * 0.20) = 1.0534
        # RAF after clamping: 1.10 (upper limit)
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 3500,
                "performance_fees": 500,
            },  # Y0: 4000
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2500,
                "performance_fees": 500,
            },  # Y-1: 3000
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2000,
                "performance_fees": 500,
            },  # Y-2: 2500
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 1500,
                "performance_fees": 500,
            },  # Y-3: 2000
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 1.10 (upper limit)
        assert round(raf, 4) == 1.10

    def test_raf_lower_limit(self):
        """Test RAF calculation with large negative change that exceeds the lower limit."""
        # Mock data with -60% revenue change
        # Y0: 1000, Y-1: 2000, Y-2: 2500, Y-3: 3000
        # Recent avg (Y0, Y-1, Y-2): 1833
        # Older avg (Y-1, Y-2, Y-3): 2500
        # Change: (1833 - 2500) / 2500 = -0.2668 (-26.68%)
        # RAF before clamping: 1 + (-0.2668 * 0.20) = 0.9466
        # RAF after clamping: 0.90 (lower limit)
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 800,
                "performance_fees": 200,
            },  # Y0: 1000
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 1700,
                "performance_fees": 300,
            },  # Y-1: 2000
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2200,
                "performance_fees": 300,
            },  # Y-2: 2500
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 2700,
                "performance_fees": 300,
            },  # Y-3: 3000
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 0.90 (lower limit)
        assert round(raf, 4) == 0.90

    def test_multiple_funds(self):
        """Test RAF calculation with multiple funds."""
        # Mock data with two funds
        # Fund1: Y0: 3000, Y-1: 2800, Y-2: 2600, Y-3: 2400
        # Fund2: Y0: 2000, Y-1: 1900, Y-2: 1800, Y-3: 1700
        # Total: Y0: 5000, Y-1: 4700, Y-2: 4400, Y-3: 4100
        # Recent avg (Y0, Y-1, Y-2): 4700
        # Older avg (Y-1, Y-2, Y-3): 4400
        # Change: (4700 - 4400) / 4400 = 0.0682 (6.82%)
        # RAF: 1 + (0.0682 * 0.20) = 1.0136
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 2500,
                "performance_fees": 500,
            },  # Y0: 3000
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2300,
                "performance_fees": 500,
            },  # Y-1: 2800
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2100,
                "performance_fees": 500,
            },  # Y-2: 2600
            {
                "fund_id": "FUND1",
                "year": 2022,
                "management_fees": 1900,
                "performance_fees": 500,
            },  # Y-3: 2400
            {
                "fund_id": "FUND2",
                "year": 2025,
                "management_fees": 1600,
                "performance_fees": 400,
            },  # Y0: 2000
            {
                "fund_id": "FUND2",
                "year": 2024,
                "management_fees": 1500,
                "performance_fees": 400,
            },  # Y-1: 1900
            {
                "fund_id": "FUND2",
                "year": 2023,
                "management_fees": 1400,
                "performance_fees": 400,
            },  # Y-2: 1800
            {
                "fund_id": "FUND2",
                "year": 2022,
                "management_fees": 1300,
                "performance_fees": 400,
            },  # Y-3: 1700
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # Expected RAF: 1.0136
        assert round(raf, 4) == 1.0136

    def test_missing_years(self):
        """Test RAF calculation with missing years."""
        # Mock data with missing Y-3
        # Y0: 3000, Y-1: 2800, Y-2: 2600, Y-3: missing
        # Recent avg (Y0, Y-1, Y-2): 2800
        # Older avg (Y-1, Y-2): 2700 (missing Y-3)
        # Change: (2800 - 2700) / 2700 = 0.037 (3.7%)
        # RAF: 1 + (0.037 * 0.20) = 1.0074
        team_revenue_data = [
            {
                "fund_id": "FUND1",
                "year": 2025,
                "management_fees": 2500,
                "performance_fees": 500,
            },  # Y0: 3000
            {
                "fund_id": "FUND1",
                "year": 2024,
                "management_fees": 2300,
                "performance_fees": 500,
            },  # Y-1: 2800
            {
                "fund_id": "FUND1",
                "year": 2023,
                "management_fees": 2100,
                "performance_fees": 500,
            },  # Y-2: 2600
            # Y-3 is missing
        ]

        raf = calc_raf("EMP001", "2025", team_revenue_data)

        # With missing data, we should still get a valid RAF
        assert 0.9 <= raf <= 1.1

    def test_calculate_average_revenue(self):
        """Test the _calculate_average_revenue helper function."""
        revenue_by_year = {2025: 3000, 2024: 2800, 2023: 2600, 2022: 2400}

        # Test with all years present
        avg1 = _calculate_average_revenue(revenue_by_year, [2025, 2024, 2023])
        assert avg1 == 2800

        # Test with some years missing
        avg2 = _calculate_average_revenue(revenue_by_year, [2025, 2024, 2021])
        assert avg2 == 2900  # (3000 + 2800) / 2

        # Test with all years missing
        avg3 = _calculate_average_revenue(revenue_by_year, [2021, 2020, 2019])
        assert avg3 == 0
