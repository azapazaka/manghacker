import api from "./client";

export const applicationApi = {
  apply: (formData) =>
    api.post("/applications", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  my: () => api.get("/applications/my"),
  offers: () => api.get("/applications/offers"),
  sendOffer: (applicationId) => api.post(`/applications/${applicationId}/offer`),
  acceptOffer: (applicationId) => api.post(`/applications/${applicationId}/accept`),
  rejectOffer: (applicationId) => api.post(`/applications/${applicationId}/reject`)
};
