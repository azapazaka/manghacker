import api from "./client";

export const vacancyApi = {
  list: (params) => api.get("/vacancies", { params }),
  detail: (id) => api.get(`/vacancies/${id}`),
  my: () => api.get("/vacancies/my"),
  candidates: (id) => api.get(`/vacancies/${id}/candidates`),
  create: (payload) => api.post("/vacancies", payload),
  update: (id, payload) => api.put(`/vacancies/${id}`, payload),
  close: (id) => api.delete(`/vacancies/${id}`)
};
