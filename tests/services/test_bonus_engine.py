"""Tests for the bonus calculation engine service."""

from unittest.mock import patch

from services.bonus_engine import calculate_bonus


class TestBonusEngine:
    """Test cases for the bonus calculation engine."""

    @patch("services.bonus_engine.calc_investment_score")
    @patch("services.bonus_engine.calc_qualitative_score")
    @patch("services.bonus_engine.calc_raf")
    def test_bonus_calculation_high_performance(self, mock_raf, mock_qual, mock_inv):
        """Test bonus calculation with high performance (alpha +400bps).

        Scenario:
        - Base salary: 100,000
        - Target bonus: 30%
        - Investment score: 0.6 * 1.8 = 1.08 (alpha +400bps, above the 300bps cap)
        - Qualitative score: 0.4 * 1.2 = 0.48 (high qualitative ratings)
        - Performance multiplier: 1.08 + 0.48 = 1.56
        - Initial bonus: 100,000 * 0.3 * 1.56 = 46,800
        - RAF: 1.05 (5% revenue growth)
        - Final bonus: 46,800 * 1.05 = 49,140
        """
        # Mock the component functions
        mock_inv.return_value = 1.08  # 60% weight * 1.8 multiplier
        mock_qual.return_value = 0.48  # 40% weight * 1.2 multiplier
        mock_raf.return_value = 1.05  # 5% revenue growth

        # Calculate bonus
        result = calculate_bonus(
            "EMP001", "2025", base_salary=100000, target_bonus_pct=0.30
        )

        # Verify the results
        assert result["base_salary"] == 100000
        assert result["target_bonus_pct"] == 0.30
        assert result["target_bonus"] == 30000
        assert result["investment_score"] == 1.08
        assert result["qualitative_score"] == 0.48
        assert result["perf_multiplier"] == 1.56
        assert result["initial_bonus"] == 46800
        assert result["raf"] == 1.05
        assert result["final_bonus"] == 49140

    @patch("services.bonus_engine.calc_investment_score")
    @patch("services.bonus_engine.calc_qualitative_score")
    @patch("services.bonus_engine.calc_raf")
    def test_bonus_calculation_negative_alpha(self, mock_raf, mock_qual, mock_inv):
        """Test bonus calculation with negative alpha (-50bps).

        Scenario:
        - Base salary: 100,000
        - Target bonus: 30%
        - Investment score: 0.6 * 0.0 = 0.0 (alpha -50bps, below 0)
        - Qualitative score: 0.4 * 1.0 = 0.4 (average qualitative ratings)
        - Performance multiplier: 0.0 + 0.4 = 0.4
        - Initial bonus: 100,000 * 0.3 * 0.4 = 12,000
        - RAF: 0.98 (-2% revenue decline)
        - Final bonus: 12,000 * 0.98 = 11,760
        """
        # Mock the component functions
        mock_inv.return_value = 0.0  # 60% weight * 0.0 multiplier (negative alpha)
        mock_qual.return_value = 0.4  # 40% weight * 1.0 multiplier (average)
        mock_raf.return_value = 0.98  # -2% revenue decline

        # Calculate bonus
        result = calculate_bonus(
            "EMP001", "2025", base_salary=100000, target_bonus_pct=0.30
        )

        # Verify the results
        assert result["base_salary"] == 100000
        assert result["target_bonus_pct"] == 0.30
        assert result["target_bonus"] == 30000
        assert result["investment_score"] == 0.0
        assert result["qualitative_score"] == 0.4
        assert result["perf_multiplier"] == 0.4
        assert result["initial_bonus"] == 12000
        assert result["raf"] == 0.98
        assert result["final_bonus"] == 11760

    @patch("services.bonus_engine.calc_investment_score")
    @patch("services.bonus_engine.calc_qualitative_score")
    @patch("services.bonus_engine.calc_raf")
    def test_bonus_calculation_at_benchmark(self, mock_raf, mock_qual, mock_inv):
        """Test bonus calculation with performance at benchmark (0bps alpha).

        Scenario:
        - Base salary: 100,000
        - Target bonus: 30%
        - Investment score: 0.6 * 1.0 = 0.6 (alpha 0bps, at benchmark)
        - Qualitative score: 0.4 * 1.0 = 0.4 (average qualitative ratings)
        - Performance multiplier: 0.6 + 0.4 = 1.0
        - Initial bonus: 100,000 * 0.3 * 1.0 = 30,000
        - RAF: 1.0 (no revenue change)
        - Final bonus: 30,000 * 1.0 = 30,000
        """
        # Mock the component functions
        mock_inv.return_value = 0.6  # 60% weight * 1.0 multiplier (at benchmark)
        mock_qual.return_value = 0.4  # 40% weight * 1.0 multiplier (average)
        mock_raf.return_value = 1.0  # no revenue change

        # Calculate bonus
        result = calculate_bonus(
            "EMP001", "2025", base_salary=100000, target_bonus_pct=0.30
        )

        # Verify the results
        assert result["base_salary"] == 100000
        assert result["target_bonus_pct"] == 0.30
        assert result["target_bonus"] == 30000
        assert result["investment_score"] == 0.6
        assert result["qualitative_score"] == 0.4
        assert result["perf_multiplier"] == 1.0
        assert result["initial_bonus"] == 30000
        assert result["raf"] == 1.0
        assert result["final_bonus"] == 30000

    @patch("services.bonus_engine.calc_investment_score")
    @patch("services.bonus_engine.calc_qualitative_score")
    @patch("services.bonus_engine.calc_raf")
    def test_bonus_calculation_high_raf_cap(self, mock_raf, mock_qual, mock_inv):
        """Test bonus calculation with RAF at upper cap.

        Scenario:
        - Base salary: 100,000
        - Target bonus: 30%
        - Investment score: 0.6 * 1.5 = 0.9 (alpha +200bps)
        - Qualitative score: 0.4 * 1.2 = 0.48 (high qualitative ratings)
        - Performance multiplier: 0.9 + 0.48 = 1.38
        - Initial bonus: 100,000 * 0.3 * 1.38 = 41,400
        - RAF: 1.10 (capped at upper limit)
        - Final bonus: 41,400 * 1.10 = 45,540
        """
        # Mock the component functions
        mock_inv.return_value = 0.9  # 60% weight * 1.5 multiplier
        mock_qual.return_value = 0.48  # 40% weight * 1.2 multiplier
        mock_raf.return_value = 1.10  # at upper cap

        # Calculate bonus
        result = calculate_bonus(
            "EMP001", "2025", base_salary=100000, target_bonus_pct=0.30
        )

        # Verify the results
        assert result["base_salary"] == 100000
        assert result["target_bonus_pct"] == 0.30
        assert result["target_bonus"] == 30000
        assert result["investment_score"] == 0.9
        assert result["qualitative_score"] == 0.48
        assert result["perf_multiplier"] == 1.38
        assert result["initial_bonus"] == 41400
        assert result["raf"] == 1.10
        assert result["final_bonus"] == 45540

    @patch("services.bonus_engine.calc_investment_score")
    @patch("services.bonus_engine.calc_qualitative_score")
    @patch("services.bonus_engine.calc_raf")
    @patch("services.bonus_engine.logger")
    def test_bonus_exceeds_3x_base_salary(
        self, mock_logger, mock_raf, mock_qual, mock_inv
    ):
        """Test bonus calculation that exceeds 3× base salary (should log warning).

        Scenario:
        - Base salary: 100,000
        - Target bonus: 100% (high target)
        - Investment score: 0.6 * 1.8 = 1.08 (alpha +400bps)
        - Qualitative score: 0.4 * 1.2 = 0.48 (high qualitative ratings)
        - Performance multiplier: 1.08 + 0.48 = 1.56
        - Initial bonus: 100,000 * 1.0 * 1.56 = 156,000
        - RAF: 1.10 (capped at upper limit)
        - Final bonus: 156,000 * 1.10 = 171,600 (exceeds 3× base salary)
        """
        # Mock the component functions
        mock_inv.return_value = 1.08  # 60% weight * 1.8 multiplier
        mock_qual.return_value = 0.48  # 40% weight * 1.2 multiplier
        mock_raf.return_value = 1.10  # at upper cap

        # Calculate bonus
        result = calculate_bonus(
            "EMP001",
            "2025",
            base_salary=100000,
            target_bonus_pct=1.0,  # 100% target bonus
        )

        # Verify the results
        assert result["base_salary"] == 100000
        assert result["target_bonus_pct"] == 1.0
        assert result["target_bonus"] == 100000
        assert result["investment_score"] == 1.08
        assert result["qualitative_score"] == 0.48
        assert result["perf_multiplier"] == 1.56
        assert result["initial_bonus"] == 156000
        assert result["raf"] == 1.10
        assert result["final_bonus"] == 171600

        # Verify that a warning was logged
        mock_logger.warning.assert_called_once()
