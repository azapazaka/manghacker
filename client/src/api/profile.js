import api from "./client";

export const profileApi = {
  me: () => api.get("/profile/me"),
  update: (payload) => api.put("/profile/me", payload)
};
