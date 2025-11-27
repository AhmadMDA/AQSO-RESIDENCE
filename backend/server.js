const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const USERS_FILE = path.join(__dirname, 'users.json');
const PROFILES_FILE = path.join(__dirname, 'profiles.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');
const CUSTOMERS_FILE = path.join(__dirname, 'customers.json');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key_change_me';

app.use(cors());
app.use(express.json());

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readProfiles() {
  try {
    const data = fs.readFileSync(PROFILES_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    return {};
  }
}

function writeProfiles(profiles) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function readTransactions() {
  try {
    const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function writeTransactions(transactions) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
}

function readCustomers() {
  try {
    const data = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function writeCustomers(customers) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { email, password: hashed, role };
  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ message: 'User created' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { email: user.email, role: user.role } });
});

app.get('/api/users', (req, res) => {
  const users = readUsers();
  const safeUsers = users.map(u => ({ email: u.email, role: u.role }));
  res.json(safeUsers);
});

app.put('/api/users/:email', (req, res) => {
  const { email } = req.params;
  const { role } = req.body;
  if (!role || !['admin', 'pemilik'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.role = role;
  writeUsers(users);
  res.json({ message: 'User updated', user: { email: user.email, role: user.role } });
});

app.delete('/api/users/:email', (req, res) => {
  const { email } = req.params;
  const users = readUsers();
  const index = users.findIndex(u => u.email === email);
  if (index === -1) return res.status(404).json({ message: 'User not found' });
  
  users.splice(index, 1);
  writeUsers(users);
  res.json({ message: 'User deleted' });
});

app.get('/api/profile/:email', (req, res) => {
  const { email } = req.params;
  const profiles = readProfiles();
  const profile = profiles[email] || {};
  res.json(profile);
});

app.put('/api/profile/:email', (req, res) => {
  const { email } = req.params;
  const profileData = req.body;
  const profiles = readProfiles();
  profiles[email] = profileData;
  writeProfiles(profiles);
  res.json({ message: 'Profile updated', profile: profiles[email] });
});

// Transactions endpoints
app.get('/api/transactions', (req, res) => {
  console.log('[GET /api/transactions] request from', req.ip);
  const transactions = readTransactions();
  res.json(transactions);
});

// Customers endpoints for User Table (separate from auth /api/users)
app.get('/api/customers', (req, res) => {
  const customers = readCustomers();
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const payload = req.body || {};
  const customers = readCustomers();
  const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id || 0)) + 1 : 1;

  const record = {
    id: nextId,
    tanggal: payload.tanggal || new Date().toISOString().slice(0,10),
    nama: payload.nama || '',
    alamat: payload.alamat || '',
    no_telpon: payload.no_telpon || '',
    type: payload.type || '',
    harga: payload.harga != null ? payload.harga : 0,
    no_rumah: payload.no_rumah || '',
    keterangan: payload.keterangan || '',
    lunas: !!payload.lunas
  };
  customers.push(record);
  writeCustomers(customers);
  res.status(201).json(record);
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const customers = readCustomers();
  const idx = customers.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Customer not found' });
  const updated = { ...customers[idx], ...payload, id: customers[idx].id };
  customers[idx] = updated;
  writeCustomers(customers);
  res.json(updated);
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  let customers = readCustomers();
  const idx = customers.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Customer not found' });
  const removed = customers.splice(idx, 1);
  writeCustomers(customers);
  res.json({ message: 'Deleted', customer: removed[0] });
});

app.post('/api/transactions', (req, res) => {
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

  const transactions = readTransactions();
  const nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id || 0)) + 1 : 1;

  // Determine next sequential no_kwitansi if not provided
  let assignedNo = tx.no_kwitansi;
  if (!assignedNo) {
    // Extract numeric parts from existing no_kwitansi values
    const nums = transactions.map(t => {
      if (!t.no_kwitansi) return 0;
      const digits = String(t.no_kwitansi).replace(/\D/g, '');
      return digits ? parseInt(digits, 10) : 0;
    });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const nextNum = maxNum + 1;
    assignedNo = String(nextNum).padStart(3, '0');
  }

  const newTx = { id: nextId, no_kwitansi: assignedNo, ...tx };
  transactions.push(newTx);
  writeTransactions(transactions);
  console.log('[POST /api/transactions] created:', newTx);
  res.status(201).json(newTx);
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const transactions = readTransactions();
  const idx = transactions.findIndex(t => String(t.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Transaction not found' });
  transactions[idx] = { ...transactions[idx], ...payload };
  writeTransactions(transactions);
  res.json(transactions[idx]);
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  let transactions = readTransactions();
  const idx = transactions.findIndex(t => String(t.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Transaction not found' });
  const removed = transactions.splice(idx, 1);
  writeTransactions(transactions);
  res.json({ message: 'Deleted', transaction: removed[0] });
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
