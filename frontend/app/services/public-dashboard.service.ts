const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

export type PublicDashboardSummary = {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

export const publicDashboardService = {
  async getSummary() {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/public/summary`,
      {
        method: "GET",
        // This public landing-page request must not send the user's auth token or cookies.
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    );
    const result = await response.json() as {
      success: boolean;
      data: PublicDashboardSummary;
      message?: string;
    };

    if (!response.ok || !result.success) {
      throw new Error(result.message ?? `Unable to load dashboard data (${response.status}).`);
    }

    return result.data;
  },
};
