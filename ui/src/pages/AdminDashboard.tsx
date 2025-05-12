import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  uploadTeamRevenue,
  createQualitativeScore,
  QualitativeScoreData,
} from "../services/api";

const AdminDashboard = () => {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for qualitative score form
  const [empId, setEmpId] = useState<string>("");
  const [qualitativeData, setQualitativeData] = useState<QualitativeScoreData>({
    review_period: new Date().getFullYear().toString(),
    risk_score: 0.5,
    compliance_score: 0.5,
    teamwork_score: 0.5,
    esg_score: 0.5,
    client_score: 0.5,
  });

  // Mock data for dashboard metrics
  const dashboardMetrics = {
    totalCompensation: 12500000,
    averageBonusMultiple: 1.2,
    rafDistribution: [
      { range: "0.90-0.95", count: 12 },
      { range: "0.95-1.00", count: 28 },
      { range: "1.00-1.05", count: 35 },
      { range: "1.05-1.10", count: 15 },
    ],
  };

  // Mock data for pay grades
  const payGrades = [
    { grade: "A1", minSalary: 40000, maxSalary: 60000, targetBonus: 0.1 },
    { grade: "A2", minSalary: 55000, maxSalary: 75000, targetBonus: 0.15 },
    { grade: "B1", minSalary: 70000, maxSalary: 90000, targetBonus: 0.2 },
    { grade: "B2", minSalary: 85000, maxSalary: 110000, targetBonus: 0.25 },
    { grade: "C1", minSalary: 100000, maxSalary: 130000, targetBonus: 0.3 },
    { grade: "C2", minSalary: 120000, maxSalary: 160000, targetBonus: 0.35 },
  ];

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await uploadTeamRevenue(file);
      setUploadStatus(result);
      if (result.status === "success") {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setFile(null);
      }
    } catch (error) {
      setUploadStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  // Handle qualitative score form change
  const handleQualitativeChange = (
    field: keyof QualitativeScoreData,
    value: string | number,
  ) => {
    setQualitativeData((prev) => ({
      ...prev,
      [field]: field === "review_period" ? value : parseFloat(value as string),
    }));
  };

  // Handle qualitative score form submission
  const handleQualitativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) return;

    try {
      await createQualitativeScore(empId, qualitativeData);
      // Reset form
      setEmpId("");
      setQualitativeData({
        review_period: new Date().getFullYear().toString(),
        risk_score: 0.5,
        compliance_score: 0.5,
        teamwork_score: 0.5,
        esg_score: 0.5,
        client_score: 0.5,
      });
      alert("Qualitative score created successfully");
    } catch (error) {
      alert(
        `Error creating qualitative score: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "percent",
      minimumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Compensation */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-2">Total Compensation Cost</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(dashboardMetrics.totalCompensation)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Year to date</p>
        </div>

        {/* Average Bonus Multiple */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-2">Average Bonus Multiple</h3>
          <p className="text-3xl font-bold">
            {dashboardMetrics.averageBonusMultiple.toFixed(2)}×
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Across all employees
          </p>
        </div>

        {/* RAF Distribution */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-2">RAF Distribution</h3>
          <div className="h-24 flex items-end space-x-1">
            {dashboardMetrics.rafDistribution.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-primary rounded-t"
                  style={{
                    height: `${(item.count / Math.max(...dashboardMetrics.rafDistribution.map((d) => d.count))) * 100}%`,
                  }}
                ></div>
                <span className="text-xs mt-1">{item.range}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Mini-histogram of RAF values
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pay Grades Table */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-muted">
            <h3 className="text-lg font-medium">Pay Grades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2 text-left">Grade</th>
                  <th className="px-4 py-2 text-left">Min Salary</th>
                  <th className="px-4 py-2 text-left">Max Salary</th>
                  <th className="px-4 py-2 text-left">Target Bonus</th>
                </tr>
              </thead>
              <tbody>
                {payGrades.map((grade, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{grade.grade}</td>
                    <td className="px-4 py-2">
                      {formatCurrency(grade.minSalary)}
                    </td>
                    <td className="px-4 py-2">
                      {formatCurrency(grade.maxSalary)}
                    </td>
                    <td className="px-4 py-2">
                      {formatPercentage(grade.targetBonus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qualitative Score Form */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-muted">
            <h3 className="text-lg font-medium">Add Qualitative Score</h3>
          </div>
          <form onSubmit={handleQualitativeSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="empId" className="block text-sm font-medium mb-1">
                Employee ID
              </label>
              <input
                id="empId"
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reviewPeriod"
                className="block text-sm font-medium mb-1"
              >
                Review Period
              </label>
              <input
                id="reviewPeriod"
                type="text"
                value={qualitativeData.review_period}
                onChange={(e) =>
                  handleQualitativeChange("review_period", e.target.value)
                }
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Score */}
              <div>
                <label
                  htmlFor="riskScore"
                  className="block text-sm font-medium mb-1"
                >
                  Risk Score: {qualitativeData.risk_score.toFixed(2)}
                </label>
                <input
                  id="riskScore"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={qualitativeData.risk_score}
                  onChange={(e) =>
                    handleQualitativeChange("risk_score", e.target.value)
                  }
                  className="w-full"
                />
              </div>
              {/* Compliance Score */}
              <div>
                <label
                  htmlFor="complianceScore"
                  className="block text-sm font-medium mb-1"
                >
                  Compliance Score:{" "}
                  {qualitativeData.compliance_score.toFixed(2)}
                </label>
                <input
                  id="complianceScore"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={qualitativeData.compliance_score}
                  onChange={(e) =>
                    handleQualitativeChange("compliance_score", e.target.value)
                  }
                  className="w-full"
                />
              </div>
              {/* Teamwork Score */}
              <div>
                <label
                  htmlFor="teamworkScore"
                  className="block text-sm font-medium mb-1"
                >
                  Teamwork Score: {qualitativeData.teamwork_score.toFixed(2)}
                </label>
                <input
                  id="teamworkScore"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={qualitativeData.teamwork_score}
                  onChange={(e) =>
                    handleQualitativeChange("teamwork_score", e.target.value)
                  }
                  className="w-full"
                />
              </div>
              {/* ESG Score */}
              <div>
                <label
                  htmlFor="esgScore"
                  className="block text-sm font-medium mb-1"
                >
                  ESG Score: {qualitativeData.esg_score.toFixed(2)}
                </label>
                <input
                  id="esgScore"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={qualitativeData.esg_score}
                  onChange={(e) =>
                    handleQualitativeChange("esg_score", e.target.value)
                  }
                  className="w-full"
                />
              </div>
              {/* Client Score */}
              <div className="md:col-span-2">
                <label
                  htmlFor="clientScore"
                  className="block text-sm font-medium mb-1"
                >
                  Client Outcomes Score:{" "}
                  {qualitativeData.client_score.toFixed(2)}
                </label>
                <input
                  id="clientScore"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={qualitativeData.client_score}
                  onChange={(e) =>
                    handleQualitativeChange("client_score", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save Qualitative Score
            </button>
          </form>
        </div>
      </div>

      {/* Team Revenue Upload */}
      <div className="mt-8 bg-card rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-muted">
          <h3 className="text-lg font-medium">Upload Team Revenue CSV</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with columns: fund_id, year, management_fees,
            performance_fees
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="flex-1"
            />
            <button
              onClick={handleUpload}
              disabled={!file}
              className={`px-4 py-2 rounded-md ${
                file
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              } transition-colors`}
            >
              Upload
            </button>
          </div>
          {uploadStatus && (
            <div
              className={`mt-4 p-3 rounded-md ${
                uploadStatus.status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {uploadStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
