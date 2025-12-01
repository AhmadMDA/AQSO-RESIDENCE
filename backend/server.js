const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// Import Sequelize models
const db = require('./models');
const { User, Profile, Transaction, Customer } = db;

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key_change_me';

app.use(cors());
app.use(express.json());

// Import OAuth routes with error handling
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api', authRoutes);
  console.log('[Server] OAuth routes loaded successfully');
} catch (error) {
  console.error('[Server] Error loading OAuth routes:', error.message);
  console.error('[Server] Email provider login will not work. Run: npm install nodemailer');
}

// Test database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('[Database] Connection established successfully');
  })
  .catch(err => {
    console.error('[Database] Unable to connect:', err.message);
    console.error('[Database] Make sure MySQL is running and database exists');
  });

app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    oauth: 'enabled'
  });
});

// Test endpoint for OAuth routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'OAuth routes are working',
    availableProviders: ['google', 'microsoft', 'yahoo'],
    endpoints: {
      google: '/api/auth/google',
      microsoft: '/api/auth/microsoft',
      yahoo: '/api/auth/yahoo'
    }
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed, role });

    console.log(`[Database] New user registered: ${email} with role: ${role}`);
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error('[Database] Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Find user in database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    
    console.log(`[Database] User logged in: ${email}`);
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error('[Database] Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['email', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    console.error('[Database] Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;
    
    if (!role || !['admin', 'pemilik'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    console.log(`[Database] User role updated: ${email} -> ${role}`);
    res.json({ message: 'User updated', user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error('[Database] Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy();
    
    console.log(`[Database] User deleted: ${email}`);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[Database] Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    let profile = await Profile.findOne({ where: { email } });
    if (!profile) {
      profile = {};
    }
    
    res.json(profile);
  } catch (error) {
    console.error('[Database] Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profileData = req.body;
    
    let profile = await Profile.findOne({ where: { email } });
    
    if (profile) {
      // Update existing profile
      await profile.update(profileData);
    } else {
      // Create new profile
      profile = await Profile.create({ email, ...profileData });
    }
    
    console.log(`[Database] Profile updated: ${email}`);
    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    console.error('[Database] Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Transactions endpoints
app.get('/api/transactions', async (req, res) => {
  try {
    console.log('[GET /api/transactions] request from', req.ip);
    const transactions = await Transaction.findAll({
      order: [['tanggal', 'DESC'], ['id', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    console.error('[Database] Get transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Customers endpoints for User Table (separate from auth /api/users)
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [['tanggal', 'DESC'], ['id', 'DESC']]
    });
    res.json(customers);
  } catch (error) {
    console.error('[Database] Get customers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const payload = req.body || {};
    
    const record = await Customer.create({
      tanggal: payload.tanggal || new Date().toISOString().slice(0,10),
      nama: payload.nama || '',
      alamat: payload.alamat || '',
      no_telpon: payload.no_telpon || '',
      type: payload.type || '',
      harga: payload.harga != null ? payload.harga : 0,
      no_rumah: payload.no_rumah || '',
      keterangan: payload.keterangan || '',
      lunas: !!payload.lunas
    });
    
    console.log(`[Database] New customer created: ${record.nama} (ID: ${record.id})`);
    res.status(201).json(record);
  } catch (error) {
    console.error('[Database] Create customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.update(payload);
    
    console.log(`[Database] Customer updated: ${customer.nama} (ID: ${id})`);
    res.json(customer);
  } catch (error) {
    console.error('[Database] Update customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const customerData = customer.toJSON();
    await customer.destroy();
    
    console.log(`[Database] Customer deleted: ${customerData.nama} (ID: ${id})`);
    res.json({ message: 'Deleted', customer: customerData });
  } catch (error) {
    console.error('[Database] Delete customer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const tx = req.body;
    console.log('[POST /api/transactions] incoming:', tx);
    
    if (!tx || !tx.diterima_dari || !tx.untuk_pembayaran || tx.jumlah === undefined) {
      const missing = [];
      if (!tx) missing.push('body');
      else {
        if (!tx.diterima_dari) missing.push('diterima_dari');
        if (!tx.untuk_pembayaran) missing.push('untuk_pembayaran');
        if (tx.jumlah === undefined) missing.push('jumlah');
      }
      console.warn('[POST /api/transactions] validation failed, missing:', missing);
      return res.status(400).json({ message: 'Missing required transaction fields', missing });
    }

    // Determine next sequential no_kwitansi if not provided
    let assignedNo = tx.no_kwitansi;
    if (!assignedNo) {
      const allTransactions = await Transaction.findAll({
        attributes: ['no_kwitansi']
      });
      
      const nums = allTransactions.map(t => {
        if (!t.no_kwitansi) return 0;
        const digits = String(t.no_kwitansi).replace(/\D/g, '');
        return digits ? parseInt(digits, 10) : 0;
      });
      const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
      const nextNum = maxNum + 1;
      assignedNo = String(nextNum).padStart(3, '0');
    }

    const newTx = await Transaction.create({
      no_kwitansi: assignedNo,
      ...tx
    });
    
    console.log('[Database] New transaction created:', newTx.no_kwitansi);
    res.status(201).json(newTx);
  } catch (error) {
    console.error('[Database] Create transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    await transaction.update(payload);
    
    console.log(`[Database] Transaction updated: ${transaction.no_kwitansi} (ID: ${id})`);
    res.json(transaction);
  } catch (error) {
    console.error('[Database] Update transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transaction.toJSON();
    await transaction.destroy();
    
    console.log(`[Database] Transaction deleted: ${transactionData.no_kwitansi} (ID: ${id})`);
    res.json({ message: 'Deleted', transaction: transactionData });
  } catch (error) {
    console.error('[Database] Delete transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
