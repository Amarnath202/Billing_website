import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { salesAPI, salesOrderAPI, accountReceivableAPI, customerAPI, purchaseAPI } from '../services/api';
import { format } from 'date-fns';

function Dashboard() {
  const [stats, setStats] = useState({
    pendingSalesOrders: 0,
    completedSalesOrders: 0,
    pendingPurchaseOrders: 0,
    completedPurchaseOrders: 0,
    paymentReceivables: 0,
    paymentPayables: 0,
    todaySales: 0,
    totalCustomers: 0
  });

  const [weeklyStats, setWeeklyStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Professional color palette
  const pieColors = ['#ff9f43', '#4caf50', '#2196f3', '#f44336', '#9c27b0', '#ff5722'];

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching stats...');

      const [
        salesOrdersRes,
        accountReceivableRes,
        salesStatsRes,
        customersRes,
        purchasesRes,
        weeklyStatsRes,
        topProductsRes
      ] = await Promise.all([
        salesOrderAPI.getAll(),
        accountReceivableAPI.getAll(),
        salesAPI.getStats(),
        customerAPI.getAll(),
        purchaseAPI.getAll(),
        salesAPI.getWeeklyStats(),
        salesAPI.getTopProducts()
      ]);

      console.log('API Responses:', {
        salesOrders: salesOrdersRes.data,
        accountReceivables: accountReceivableRes.data,
        salesStats: salesStatsRes.data,
        customers: customersRes.data,
        purchases: purchasesRes.data,
        weeklyStats: weeklyStatsRes.data,
        topProducts: topProductsRes.data
      });

      // Calculate sales orders stats
      const salesOrders = salesOrdersRes.data || [];
      const pendingSalesOrders = salesOrders.filter(order => order.status === 'Pending').length;
      const completedSalesOrders = salesOrders.filter(order => order.status === 'Completed').length;

      // Calculate purchase orders stats
      const purchases = purchasesRes.data || [];
      const pendingPurchaseOrders = purchases.filter(purchase => purchase.balance > 0).length;
      const completedPurchaseOrders = purchases.filter(purchase => purchase.balance === 0).length;

      // Calculate total receivables and payables
      const totalReceivables = accountReceivableRes.data.reduce((total, receivable) =>
        total + (parseFloat(receivable.balance) || 0), 0);

      // Calculate payables from actual purchases instead of AccountPayable collection
      const totalPayables = purchases.reduce((total, purchase) =>
        total + (parseFloat(purchase.balance) || 0), 0);

      // Get today's sales from sales stats
      const todaySales = salesStatsRes.data?.todaySales || 0;

      // Get total customers
      const totalCustomers = customersRes.data?.length || 0;

      // Update weekly stats
      setWeeklyStats(weeklyStatsRes.data || []);

      // Update top products
      setTopProducts(topProductsRes.data || []);

      setStats({
        pendingSalesOrders,
        completedSalesOrders,
        pendingPurchaseOrders,
        completedPurchaseOrders,
        paymentReceivables: totalReceivables,
        paymentPayables: totalPayables,
        todaySales,
        totalCustomers
      });

      setLoading(false);

    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      setError('Failed to load dashboard data. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await salesAPI.getWeeklyStats();
      if (response.data) {
        const formattedData = response.data.map(item => ({
          ...item,
          date: format(new Date(item.date), 'MMM dd'),
          amount: Number(item.amount)
        }));
        setWeeklyStats(formattedData);
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await salesAPI.getTopProducts();
      if (response.data) {
        setTopProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchWeeklyStats();
    fetchTopProducts();

    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchStats();
      fetchWeeklyStats();
      fetchTopProducts();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={fetchStats}>
          Retry
        </Button>
      </Box>
    );
  }

  const renderCard = (title, value, color = '#ff9f43') => {
    // Format the value based on the title
    let displayValue = value;
    if (title.includes('Payment') || title.includes('Sales')) {
      displayValue = `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      displayValue = Number(value).toLocaleString('en-IN');
    }

      return (
      <Grid item xs={12} sm={6} md={3}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              backgroundColor: color,
            }
          }}
        >
          <Typography 
            variant="subtitle1" 
            color="textSecondary" 
            gutterBottom
            sx={{ 
              fontSize: '0.875rem', 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: displayValue.length > 12 ? '1.5rem' : '2rem',
              color: 'text.primary'
            }}
          >
            {displayValue}
            </Typography>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
    <Grid container spacing={3}>
        {/* Title */}
      <Grid item xs={12}>
        <Typography variant="h4" sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
          Retail Sales Dashboard
        </Typography>
      </Grid>
      
        {/* Sales Orders */}
        {renderCard('Pending Sale Orders', stats.pendingSalesOrders, '#2196f3')}
        {renderCard('Completed Sale Orders', stats.completedSalesOrders, '#4caf50')}
        {renderCard('Payment Receivables', stats.paymentReceivables, '#f44336')}
        {renderCard('Payment Paybles', stats.paymentPayables, '#ff9800')}
        
        {/* Purchase Orders */}
        {renderCard('Pending Purchase Orders', stats.pendingPurchaseOrders, '#2196f3')}
        {renderCard('Completed Purchase Orders', stats.completedPurchaseOrders, '#4caf50')}
        {renderCard("Today's Sales", stats.todaySales, '#f44336')}
        {renderCard('Total Customers', stats.totalCustomers, '#ff9800')}

      {/* Weekly Sales Chart */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Last 7 Days Sales
          </Typography>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => 
                    `₹${value.toLocaleString('en-IN', { 
                      maximumFractionDigits: 0,
                      notation: 'compact',
                      compactDisplay: 'short'
                    })}`
                  }
                />
                <Tooltip 
                  formatter={(value) => 
                    `₹${value.toLocaleString('en-IN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}`
                  }
                />
                <Bar dataKey="amount" fill="#ff9f43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      </Grid>

      {/* Top Products Pie Chart */}
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              mb: 3
            }}
          >
            Top Selling Products (Last 30 Days)
          </Typography>
          <div style={{ width: '100%', height: 400, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={topProducts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={160}
                  labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#ffffff"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        >
                          {`${name} (${(percent * 100).toFixed(1)}%)`}
                        </text>
                      );
                    }}
                >
                  {topProducts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={pieColors[index % pieColors.length]}
                      strokeWidth={1}
                      stroke="#fff"
                    />
                  ))}
                </Pie>
                <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <Paper
                            sx={{
                              p: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              border: '1px solid #eee'
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ color: payload[0].color, fontWeight: 600, mb: 1 }}>
                              {data.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2" color="textSecondary">
                                Sales: ₹{data.value.toLocaleString('en-IN', { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Quantity Sold: {data.quantity}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Orders: {data.transactions}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Market Share: {data.percentage}%
                              </Typography>
                            </Box>
                          </Paper>
                        );
                      }
                      return null;
                    }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Paper>
      </Grid>
    </Grid>
    </Box>
  );
}

export default Dashboard; 