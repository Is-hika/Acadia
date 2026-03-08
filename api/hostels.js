import connectDB from '../lib/mongodb.js';
import Hostel from '../lib/Hostel.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  if (req.method === 'GET') {
    try {
      const hostels = await Hostel.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: hostels });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, price, type, location, description, amenities, food, inTime, rules, ownerEmail, ownerName, ownerPhone } = req.body;
      if (!name || !price || !type || !location || !description || !food || !inTime || !ownerEmail || !ownerName)
        return res.status(400).json({ success: false, error: 'Missing required fields' });

      const hostel = await Hostel.create({
        name, price: parseInt(price), type, location, description,
        amenities: amenities || [], food, inTime, rules: rules || [],
        ownerEmail, ownerName, ownerPhone: ownerPhone || ''
      });
      return res.status(201).json({ success: true, data: hostel });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
