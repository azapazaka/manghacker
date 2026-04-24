import api from "./client";

export const matchApi = {
  recommendations: () => api.get("/matches/recommendations"),
  refresh: () => api.post("/matches/refresh")
};
