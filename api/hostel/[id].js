import connectDB from '../../lib/mongodb.js';
import Hostel from '../../lib/Hostel.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const hostel = await Hostel.findById(id);
      if (!hostel) return res.status(404).json({ success: false, error: 'Not found' });
      return res.status(200).json({ success: true, data: hostel });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { ownerEmail, ...updateData } = req.body;
      const hostel = await Hostel.findById(id);
      if (!hostel) return res.status(404).json({ success: false, error: 'Not found' });
      if (hostel.ownerEmail !== ownerEmail) return res.status(403).json({ success: false, error: 'Unauthorized' });
      const updated = await Hostel.findByIdAndUpdate(id, updateData, { new: true });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { ownerEmail } = req.body;
      const hostel = await Hostel.findById(id);
      if (!hostel) return res.status(404).json({ success: false, error: 'Not found' });
      if (hostel.ownerEmail !== ownerEmail) return res.status(403).json({ success: false, error: 'Unauthorized' });
      await Hostel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
