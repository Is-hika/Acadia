import connectDB from '../lib/mongodb.js';
import User from '../lib/User.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  await connectDB();
  const { action } = req.query;

  if (action === 'register') {
    try {
      const { name, email, password, phone, role } = req.body;
      if (!name || !email || !password || !role)
        return res.status(400).json({ success: false, error: 'Missing required fields' });

      const existing = await User.findOne({ email, role });
      if (existing)
        return res.status(409).json({ success: false, error: 'Email already registered' });

      const user = await User.create({ name, email, password, phone: phone || '', role });
      return res.status(201).json({ success: true, data: { name: user.name, email: user.email, phone: user.phone, role: user.role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'login') {
    try {
      const { email, password, role } = req.body;
      if (!email || !password || !role)
        return res.status(400).json({ success: false, error: 'Missing fields' });

      const user = await User.findOne({ email, role });
      if (!user)
        return res.status(401).json({ success: false, error: 'No account found with this email' });
      if (user.password !== password)
        return res.status(401).json({ success: false, error: 'Incorrect password' });

      return res.status(200).json({ success: true, data: { name: user.name, email: user.email, phone: user.phone, role: user.role } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ success: false, error: 'Invalid action' });
}
