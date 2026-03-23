import api from "./axios";

export const getTiersApi = (params) =>
    api.get("/tiers", { params });

export const createTierApi = (data) =>
    api.post("/tiers", data);

export const updateTierApi = (id, data) =>
    api.put(`/tiers/${id}`, data);

export const deleteTierApi = (id) =>
    api.delete(`/tiers/${id}`);
