import axios from 'axios';
import { api } from '../services/api';

const API_BASE_URL = 'http://localhost:5001/api';

// Users
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createUser = async (data) => {
  try {
    const response = await api.post('/users', data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Roles
export const getRoles = async () => {
  try {
    const response = await api.get('/roles');
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createRole = async (data) => {
  try {
    const response = await api.post('/roles', data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateRole = async (id, data) => {
  try {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Suppliers
export const getSuppliers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/suppliers`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createSupplier = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/suppliers`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateSupplier = async (id, data) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/suppliers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Account Payables
export const getAllAccountPayables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/account-payables`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const getAccountPayablesBySupplier = async (supplier) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/account-payables?supplier=${supplier}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createAccountPayable = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/account-payables`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateAccountPayable = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/account-payables/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteAccountPayable = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/account-payables/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Account Receivables
export const getAllAccountReceivables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/account-receivable`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const getAccountReceivablesBySupplier = async (supplier) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/account-receivable?supplier=${supplier}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createAccountReceivable = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/account-receivable`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateAccountReceivable = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/account-receivable/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteAccountReceivable = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/account-receivable/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}; 