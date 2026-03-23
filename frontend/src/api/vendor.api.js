import api from "./axios";

export const getVendorsApi = (params) =>
    api.get("/vendors", { params });

export const getVendorByIdApi = (id) =>
    api.get(`/vendors/${id}`);

export const createVendorApi = (data) =>
    api.post("/vendors", data, {
        headers: { "Content-Type": "multipart/form-data" }
    });

export const updateVendorApi = (id, data) =>
    api.put(`/vendors/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
    });

export const updateVendorStatusApi = (id, status) =>
    api.patch(`/vendors/${id}/status`, { status });

export const updateVendorKycStatusApi = (id, data) =>
    api.patch(`/vendors/${id}/kyc`, data);
