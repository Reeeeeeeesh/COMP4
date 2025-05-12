import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeCompensation, CompensationData } from "../services/api";

const EmployeeCompStatement = () => {
  const [empId, setEmpId] = useState<string>("");
  const [period, setPeriod] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);

  // Use React Query for API call
  const { data, isLoading, isError, error } = useQuery<CompensationData, Error>(
    {
      queryKey: ["compensation", empId, period],
      queryFn: () => getEmployeeCompensation(empId, period),
      enabled: searchTriggered && !!empId && !!period,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTriggered(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Employee Compensation Statement
      </h2>

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 p-6 bg-card rounded-lg shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="empId" className="block text-sm font-medium">
              Employee ID
            </label>
            <input
              id="empId"
              type="text"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter employee ID"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="period" className="block text-sm font-medium">
              Period (Year)
            </label>
            <input
              id="period"
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="YYYY"
              pattern="\\d{4}"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Loading and Error States */}
      {isLoading && <div className="text-center p-4">Loading...</div>}
      {isError && (
        <div className="text-center p-4 text-destructive">
          Error: {error.message}
        </div>
      )}

      {/* Results Card */}
      {data && !isLoading && (
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Compensation Details</h3>
            <p className="text-muted-foreground">
              Employee ID: {data.emp_id} | Period: {data.period}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Base Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="text-lg font-medium">
                  {formatCurrency(data.base_salary)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Bonus %</p>
                <p className="text-lg font-medium">
                  {formatPercentage(data.target_bonus_pct)}
                </p>
              </div>
            </div>

            {/* Performance Multipliers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Investment Multiplier (60%)
                </p>
                <p className="text-lg font-medium">
                  {data.investment_score.toFixed(2)}×
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Qualitative Multiplier (40%)
                </p>
                <p className="text-lg font-medium">
                  {data.qualitative_score.toFixed(2)}×
                </p>
              </div>
            </div>

            {/* RAF */}
            <div>
              <p className="text-sm text-muted-foreground">
                Revenue Adjustment Factor (RAF)
              </p>
              <p className="text-lg font-medium">{data.raf.toFixed(2)}×</p>
            </div>

            {/* Final Bonus */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Final Bonus</p>
              <p className="text-xl font-bold">
                {formatCurrency(data.final_bonus)}
              </p>
            </div>
          </div>

          {/* Expandable RAF Section */}
          <details className="border-t">
            <summary className="p-4 cursor-pointer font-medium hover:bg-muted/50">
              Explain RAF
            </summary>
            <div className="p-6 bg-muted/20">
              <h4 className="font-medium mb-2">
                Revenue Adjustment Factor Calculation
              </h4>
              <p className="mb-4 text-sm">
                RAF adjusts bonus based on 3-year rolling average team revenue
                changes.
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Formula:</span> RAF = 1 +
                  (Δ3yrRollingAvgTeamRevenue × 0.20)
                </p>
                <p className="text-sm">
                  <span className="font-medium">Δ3-yr rolling revenue:</span>{" "}
                  (Avg Rev Years 0-2 − Avg Rev Years -1--3) / Avg Rev Years
                  -1--3
                </p>
                <p className="text-sm">
                  <span className="font-medium">Sensitivity Factor:</span> 0.20
                </p>
                <p className="text-sm">
                  <span className="font-medium">RAF Range:</span> Clamped
                  between 0.90 and 1.10
                </p>
                <p className="text-sm">
                  <span className="font-medium">Your RAF:</span>{" "}
                  {data.raf.toFixed(4)}×
                </p>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default EmployeeCompStatement;
