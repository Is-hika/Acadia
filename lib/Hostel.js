import mongoose from 'mongoose';

const HostelSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  type:        { type: String, required: true, enum: ['boys', 'girls', 'co-ed'] },
  location:    { type: String, required: true },
  description: { type: String, required: true },
  amenities:   { type: [String], default: [] },
  food:        { type: String, required: true, enum: ['yes', 'no'] },
  inTime:      { type: String, required: true },
  rules:       { type: [String], default: [] },
  ownerEmail:  { type: String, required: true },
  ownerName:   { type: String, required: true },
  ownerPhone:  { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

export default mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);
