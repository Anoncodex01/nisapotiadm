const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000, // 60 seconds
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000 // 60 seconds
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Configure CORS
app.use(cors({
  origin: isProduction 
    ? ['https://nisapoti.co.tz'] 
    : ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Mount admin routes
app.use('/api/admin', adminRoutes);

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Function to handle database queries
async function queryDatabase(query, params = []) {
  try {
    const [results] = await pool.query(query, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Get all creators
app.get('/api/creators', authenticateToken, async (req, res) => {
  try {
    const creators = await queryDatabase(`
      SELECT 
        p.*,
        u.email,
        u.email_verified,
        CAST(COALESCE(SUM(s.amount), 0) AS DECIMAL(10,2)) as total_earnings,
        COUNT(DISTINCT s.id) as total_supporters
      FROM profiles p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN supporters s ON p.user_id = s.creator_id AND s.status = 'COMPLETED'
      GROUP BY p.id, p.user_id, p.username, p.display_name, p.creator_url, 
               p.avatar_url, p.bio, p.category, p.website, p.created_at, u.email, u.email_verified
    `);

    const transformedCreators = creators.map(creator => ({
      ...creator,
      total_earnings: parseFloat(creator.total_earnings || 0),
      total_supporters: parseInt(creator.total_supporters || 0)
    }));

    res.json(transformedCreators);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database query failed', error: String(error) });
  }
});

// Get all supporters
app.get('/api/supporters', authenticateToken, async (req, res) => {
  try {
    const supporters = await queryDatabase(`
      SELECT 
        s.id,
        s.name,
        s.phone,
        s.amount,
        s.status,
        s.created_at,
        s.updated_at,
        p.display_name as creator_name
      FROM supporters s
      LEFT JOIN profiles p ON s.creator_id = p.user_id
      ORDER BY s.created_at DESC
    `);

    const transformedSupporters = supporters.map(supporter => ({
      ...supporter,
      amount: parseFloat(supporter.amount || 0)
    }));

    res.json(transformedSupporters);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database query failed', error: String(error) });
  }
});

// Get all withdrawals
app.get('/api/withdrawals', authenticateToken, async (req, res) => {
  try {
    // Get withdrawals with creator info and payment details
    const withdrawals = await queryDatabase(`
      SELECT 
        w.*, 
        p.display_name as creator_name,
        u.phone as phone_number,
        u.full_name,
        u.bank_name,
        u.account_number
      FROM withdrawals w
      LEFT JOIN profiles p ON w.creator_id = p.user_id
      LEFT JOIN users u ON w.creator_id = u.id
      ORDER BY w.created_at DESC
    `);

    // Get total paid out
    const totalPaidOutResult = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as total_paid_out
      FROM withdrawals
      WHERE status = 'COMPLETED'
    `);

    // Get pending withdrawals total
    const pendingWithdrawalsResult = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as pending_withdrawals
      FROM withdrawals
      WHERE status = 'PENDING'
    `);

    const totalPaidOut = parseFloat(totalPaidOutResult[0].total_paid_out);
    const pendingWithdrawals = parseFloat(pendingWithdrawalsResult[0].pending_withdrawals);

    const transformedWithdrawals = withdrawals.map(withdrawal => ({
      ...withdrawal,
      amount: parseFloat(withdrawal.amount || 0)
    }));

    res.json({
      withdrawals: transformedWithdrawals,
      summary: {
        total_withdrawn: totalPaidOut,
        pending_withdrawals: pendingWithdrawals
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database query failed', error: String(error) });
  }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get total creators
    const totalCreatorsResult = await queryDatabase(`
      SELECT COUNT(DISTINCT id) as total_creators 
      FROM profiles 
      WHERE user_type = 'creator'
    `);

    // Get active creators
    const activeCreatorsResult = await queryDatabase(`
      SELECT COUNT(DISTINCT p.id) as active_creators
      FROM profiles p
      INNER JOIN supporters s ON p.id = s.creator_id
      WHERE p.user_type = 'creator' AND s.status = 'COMPLETED'
    `);

    // Get total revenue
    const totalRevenueResult = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as total_revenue
      FROM supporters
      WHERE status = 'COMPLETED'
    `);

    // Get total paid out
    const totalPaidOutResult = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as total_paid_out
      FROM withdrawals
      WHERE status = 'COMPLETED'
    `);

    // Get pending withdrawals
    const pendingPayoutsResult = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as pending_payouts
      FROM withdrawals
      WHERE status = 'PENDING'
    `);

    // Get total supporters
    const totalSupportersResult = await queryDatabase(`
      SELECT COUNT(DISTINCT id) as total_supporters
      FROM supporters
      WHERE status = 'COMPLETED'
    `);

    // Get monthly revenue data
    const monthlyRevenue = await queryDatabase(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(SUM(amount), 0) as revenue
      FROM supporters
      WHERE status = 'COMPLETED'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // Get monthly new creators data
    const monthlyCreators = await queryDatabase(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(DISTINCT id) as new_creators
      FROM profiles
      WHERE user_type = 'creator'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // Calculate revenue growth
    const prevMonthRevenue = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM supporters
      WHERE status = 'COMPLETED'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
      AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

    const currentMonthRevenue = await queryDatabase(`
      SELECT COALESCE(SUM(amount), 0) as revenue
      FROM supporters
      WHERE status = 'COMPLETED'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    `);

    const prevRevenue = parseFloat(prevMonthRevenue[0].revenue);
    const currRevenue = parseFloat(currentMonthRevenue[0].revenue);
    const revenueGrowth = prevRevenue === 0 ? 0 : ((currRevenue - prevRevenue) / prevRevenue) * 100;

    const stats = {
      total_creators: parseInt(totalCreatorsResult[0].total_creators),
      active_creators: parseInt(activeCreatorsResult[0].active_creators),
      total_revenue: parseFloat(totalRevenueResult[0].total_revenue),
      total_paid_out: parseFloat(totalPaidOutResult[0].total_paid_out),
      pending_payouts: parseFloat(pendingPayoutsResult[0].pending_payouts),
      total_supporters: parseInt(totalSupportersResult[0].total_supporters),
      growth: {
        revenue: revenueGrowth.toFixed(1)
      },
      charts: {
        revenue: {
          labels: monthlyRevenue.map(m => new Date(m.month).toLocaleString('default', { month: 'short' })),
          data: monthlyRevenue.map(m => parseFloat(m.revenue))
        },
        creators: {
          labels: monthlyCreators.map(m => new Date(m.month).toLocaleString('default', { month: 'short' })),
          data: monthlyCreators.map(m => parseInt(m.new_creators))
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: String(error) });
  }
});

// Update withdrawal status
app.put('/api/withdrawals/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await queryDatabase(
      'UPDATE withdrawals SET status = ?, updated_at = NOW() WHERE id = ?',
      [status.toUpperCase(), id]
    );

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to update status', error: String(error) });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: isProduction ? undefined : String(err)
  });
});

app.listen(port, () => {
  console.log(`Server running in ${isProduction ? 'production' : 'development'} mode at http://localhost:${port}`);
});
