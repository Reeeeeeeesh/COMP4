import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Types for API responses
export interface CompensationData {
  emp_id: string;
  period: string;
  base_salary: number;
  target_bonus_pct: number;
  target_bonus: number;
  investment_score: number;
  qualitative_score: number;
  perf_multiplier: number;
  initial_bonus: number;
  raf: number;
  final_bonus: number;
}

export interface QualitativeScoreData {
  review_period: string;
  risk_score: number;
  compliance_score: number;
  teamwork_score: number;
  esg_score: number;
  client_score: number;
}

// API functions
export const getEmployeeCompensation = async (
  empId: string,
  period: string,
): Promise<CompensationData> => {
  const response = await api.get<CompensationData>(
    `/employees/${empId}/compensation?period=${period}`,
  );
  return response.data;
};

export const createQualitativeScore = async (
  empId: string,
  data: QualitativeScoreData,
): Promise<{ status: string; message: string }> => {
  const response = await api.post<{ status: string; message: string }>(
    `/admin/qualitative/${empId}`,
    data,
  );
  return response.data;
};

export const uploadTeamRevenue = async (
  file: File,
): Promise<{ status: string; message: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ status: string; message: string }>(
    "/admin/team-revenue/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export default api;
