import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add request interceptor
api.interceptors.request.use(
    config => {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        // If token exists, add it to the request headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log('Making request to:', `${config.baseURL}${config.url}`, 'with token:', token);
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    response => {
        console.log('Response from:', response.config.url, 'Status:', response.status);
        return response;
    },
    error => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
            console.error('Unauthorized access, redirecting to login');
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

// Export the configured axios instance
export default api;

// Auth API endpoints
export const authAPI = {
    login: async (credentials) => {
        try {
            console.log('Attempting login...');
            const response = await api.post('/auth/login', credentials);
            console.log('Login successful');
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    signup: async (userData) => {
        try {
            console.log('Attempting signup...');
            const response = await api.post('/auth/signup', userData);
            console.log('Signup successful');
            return response;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },
    getRoles: async () => {
        try {
            console.log('Fetching available roles...');
            const response = await api.get('/auth/roles');
            console.log('Roles fetched successfully');
            return response;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }
};

// Supplier API endpoints
export const supplierAPI = {
    getAll: () => api.get('/suppliers'),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`)
};

// Account Payable API endpoints
export const accountPayableAPI = {
    getAll: () => api.get('/account-payable'),
    getBySupplier: (supplier) => api.get(`/account-payable/supplier/${supplier}`),
    create: (data) => api.post('/account-payable', data),
    update: (id, data) => api.put(`/account-payable/${id}`, data),
    delete: (id) => api.delete(`/account-payable/${id}`)
};

// Account Receivable API endpoints
export const accountReceivableAPI = {
    getAll: () => api.get('/account-receivable'),
    getBySupplier: (supplier) => api.get(`/account-receivable/supplier/${supplier}`),
    create: (data) => api.post('/account-receivable', data),
    update: (id, data) => api.put(`/account-receivable/${id}`, data),
    delete: (id) => api.delete(`/account-receivable/${id}`)
};

// Email API
export const emailAPI = {
    sendEmail: async (formData) => {
        return await api.post('/email/send', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getCustomers: async () => {
        return await api.get('/email/customers');
    },
    getSuppliers: async () => {
        return await api.get('/email/suppliers');
    },
    getHistory: async () => {
        return await api.get('/email/history');
    }
};

// Products API
export const productsAPI = {
    getAll: async () => {
        return await api.get('/products');
    },
    create: async (data) => {
        return await api.post('/products', data);
    },
    update: async (id, data) => {
        return await api.put(`/products/${id}`, data);
    },
    delete: async (id) => {
        return await api.delete(`/products/${id}`);
    },
};

// Sales API
export const salesAPI = {
    getAll: async () => {
        return await api.get('/sales');
    },
    create: async (data) => {
        return await api.post('/sales', data);
    },
    update: async (id, data) => {
        return await api.put(`/sales/${id}`, data);
    },
    delete: async (id) => {
        return await api.delete(`/sales/${id}`);
    },
    getStats: async () => {
        return await api.get('/sales/stats');
    },
    getWeeklyStats: async () => {
        return await api.get('/sales/weekly-stats');
    },
    getTopProducts: async () => {
        return await api.get('/sales/top-products');
    },
};

export const billingAPI = {
    getAll: () => api.get('/billing'),
    create: (data) => api.post('/billing', data),
    getById: (id) => api.get(`/billing/${id}`),
    updateStatus: (id, status) => api.patch(`/billing/${id}/status`, { status })
};

export const paymentAPI = {
    getAll: () => api.get('/payments'),
    getByType: (type) => api.get(`/payments/type/${type}`),
    create: (data) => api.post('/payments', data),
    getSummary: () => api.get('/payments/summary')
};

export const cashInHandphAPI = {
    getAll: () => api.get('/cash-in-handph'),
    create: (data) => api.post('/cash-in-handph', data),
    update: (id, data) => api.put(`/cash-in-handph/${id}`, data),
    delete: (id) => api.delete(`/cash-in-handph/${id}`)
};

export const cashInBankphAPI = {
    getAll: () => api.get('/cash-in-bankph'),
    create: (data) => api.post('/cash-in-bankph', data),
    update: (id, data) => api.put(`/cash-in-bankph/${id}`, data),
    delete: (id) => api.delete(`/cash-in-bankph/${id}`)
};

export const cashInChequephAPI = {
    getAll: () => api.get('/cash-in-chequeph'),
    create: (data) => api.post('/cash-in-chequeph', data),
    update: (id, data) => api.put(`/cash-in-chequeph/${id}`, data),
    delete: (id) => api.delete(`/cash-in-chequeph/${id}`)
};

// Purchase API endpoints
export const purchaseAPI = {
    getAll: () => api.get('/purchases'),
    getById: (id) => api.get(`/purchases/${id}`),
    create: (data) => api.post('/purchases', data),
    update: (id, data) => api.put(`/purchases/${id}`, data),
    delete: (id) => api.delete(`/purchases/${id}`),
    getSupplierTotals: () => api.get('/purchases/supplier-totals')
};

// Purchase Return API endpoints
export const purchaseReturnAPI = {
    getAll: async () => {
        try {
            const response = await api.get('/purchase-returns');
            return response;
        } catch (error) {
            console.error('Error fetching purchase returns:', error);
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/purchase-returns/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching purchase return:', error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/purchase-returns', data);
            return response;
        } catch (error) {
            console.error('Error creating purchase return:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/purchase-returns/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating purchase return:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            console.log('Deleting purchase return with ID:', id);
            const response = await api.delete(`/purchase-returns/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting purchase return:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }
};

// Customer API endpoints
export const customerAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`)
};

export const cashInHandsaAPI = {
    getAll: () => api.get('/cash-in-handsa'),
    create: (data) => api.post('/cash-in-handsa', data),
    update: (id, data) => api.put(`/cash-in-handsa/${id}`, data),
    delete: (id) => api.delete(`/cash-in-handsa/${id}`)
};

export const cashInBanksaAPI = {
    getAll: () => api.get('/cash-in-banksa'),
    create: (data) => api.post('/cash-in-banksa', data),
    update: (id, data) => api.put(`/cash-in-banksa/${id}`, data),
    delete: (id) => api.delete(`/cash-in-banksa/${id}`)
};

export const salesReturnAPI = {
    getAll: () => api.get('/sales-returns'),
    getById: (id) => api.get(`/sales-returns/${id}`),
    create: (data) => api.post('/sales-returns', data),
    update: (id, data) => api.put(`/sales-returns/${id}`, data),
    delete: (id) => api.delete(`/sales-returns/${id}`)
};

export const salesOrderAPI = {
    getAll: () => api.get('/sales-orders'),
    getById: (id) => api.get(`/sales-orders/${id}`),
    create: (data) => api.post('/sales-orders', data),
    update: (id, data) => api.put(`/sales-orders/${id}`, data),
    delete: (id) => api.delete(`/sales-orders/${id}`)
};

export const brandAPI = {
    getAll: async () => {
        try {
            console.log('Fetching all brands...');
            const response = await api.get('/brands');
            console.log('Brands response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching brands:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/brands/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching brand by ID:', error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/brands', data);
            return response;
        } catch (error) {
            console.error('Error creating brand:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/brands/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/brands/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    },
    getStock: async (id) => {
        try {
            const response = await api.get(`/brands/${id}/stock`);
            return response;
        } catch (error) {
            console.error('Error fetching brand stock:', error);
            throw error;
        }
    },
    updateStock: async (name) => {
        try {
            const response = await api.put(`/brands/${name}/stock`);
            return response;
        } catch (error) {
            console.error('Error updating brand stock:', error);
            throw error;
        }
    }
};

export const warehouseAPI = {
    getAll: async () => {
        try {
            console.log('Fetching all warehouses...');
            const response = await api.get('/warehouses');
            console.log('Warehouses response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching warehouses:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/warehouses/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching warehouse by ID:', error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/warehouses', data);
            return response;
        } catch (error) {
            console.error('Error creating warehouse:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/warehouses/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating warehouse:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/warehouses/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            throw error;
        }
    }
};

export const categoryAPI = {
    getAll: async () => {
        try {
            console.log('Fetching all categories...');
            const response = await api.get('/categories');
            console.log('Categories response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching categories:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/categories/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching category by ID:', error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/categories', data);
            return response;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/categories/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/categories/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },
    getStock: async (id) => {
        try {
            const response = await api.get(`/categories/${id}/stock`);
            return response;
        } catch (error) {
            console.error('Error fetching category stock:', error);
            throw error;
        }
    },
    updateStock: async (name) => {
        try {
            const response = await api.put(`/categories/${name}/stock`);
            return response;
        } catch (error) {
            console.error('Error updating category stock:', error);
            throw error;
        }
    }
};

export const cashInChequesaAPI = {
    getAll: () => api.get('/cash-in-chequesa'),
    getById: (id) => api.get(`/cash-in-chequesa/${id}`),
    create: (data) => api.post('/cash-in-chequesa', data),
    update: (id, data) => api.patch(`/cash-in-chequesa/${id}`, data),
    delete: (id) => api.delete(`/cash-in-chequesa/${id}`)
};

// Expense API endpoints
export const expenseAPI = {
    getAll: async (params = {}) => {
        try {
            console.log('Fetching all expenses...');
            const response = await api.get('/expenses', { params });
            console.log('Expenses response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching expenses:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/expenses/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching expense by ID:', error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/expenses', data);
            return response;
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/expenses/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/expenses/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },
    getStats: async () => {
        try {
            const response = await api.get('/expenses/stats');
            return response;
        } catch (error) {
            console.error('Error fetching expense stats:', error);
            throw error;
        }
    },
    getCategories: async () => {
        try {
            const response = await api.get('/expenses/categories');
            return response;
        } catch (error) {
            console.error('Error fetching expense categories:', error);
            throw error;
        }
    }
};

// Reports API endpoints
export const reportsAPI = {
    getProfitLoss: async (params = {}) => {
        try {
            console.log('Fetching profit and loss report...');
            const response = await api.get('/reports/profit-loss', { params });
            console.log('P&L response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching profit and loss report:', error);
            throw error;
        }
    },
    getBalanceSheet: async (params = {}) => {
        try {
            const response = await api.get('/reports/balance-sheet', { params });
            return response;
        } catch (error) {
            console.error('Error fetching balance sheet report:', error);
            throw error;
        }
    }
};