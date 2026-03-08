# Acadia
### Student Accommodation Platform for UPES, Dehradun

> Simplifying the search for verified hostels and PGs near UPES Bidholi campus.

🌐 **Live:** [acadia-kappa.vercel.app](https://acadia-kappa.vercel.app)

---

## 📌 About

Acadia is a full-stack web application that connects **PG/hostel owners** with **UPES students**. Owners can list their properties with full details, and students can search, filter, and view listings in real time — all without any page reload.

Built as a college project for UPES students in Bidholi, Dehradun.

---

## ✨ Features

### For Students
- Register & login securely
- Browse all verified hostel/PG listings
- Filter by budget, hostel type (Boys/Girls/Co-ed), food availability, amenities, in-time
- Search by name or location
- View full hostel details including owner contact
- Open location directly in Google Maps

### For Owners
- Register & login as a property owner
- Add new hostel/PG listings with full details
- Edit or delete your own listings
- Listings visible to students instantly after posting

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | MongoDB Atlas (Cloud) |
| ODM | Mongoose |
| Hosting | Vercel |

---

## 📁 Project Structure

```
acadia/
├── api/
│   ├── auth.js           ← Register & Login (students + owners)
│   ├── hostels.js        ← GET all hostels / POST new hostel
│   └── hostel/
│       └── [id].js       ← GET / PUT / DELETE single hostel
├── lib/
│   ├── mongodb.js        ← MongoDB connection (Mongoose)
│   ├── Hostel.js         ← Hostel schema & model
│   └── User.js           ← User schema & model
├── index.html            ← Landing page
├── student.html          ← Student portal
├── owner.html            ← Owner portal
├── style.css             ← All styling
├── script.js             ← All frontend logic
├── package.json
└── vercel.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth?action=register` | Register a new user |
| POST | `/api/auth?action=login` | Login existing user |
| GET | `/api/hostels` | Fetch all hostel listings |
| POST | `/api/hostels` | Create a new listing |
| GET | `/api/hostel/:id` | Get single hostel details |
| PUT | `/api/hostel/:id` | Update a listing (owner only) |
| DELETE | `/api/hostel/:id` | Delete a listing (owner only) |

---

## 🗄 Database Structure

**`users` collection**
```json
{
  "name": "Ishika",
  "email": "ishika@gmail.com",
  "password": "pass123",
  "phone": "9876543210",
  "role": "student",
  "createdAt": "2026-03-08T00:00:00.000Z"
}
```

**`hostels` collection**
```json
{
  "name": "Green Valley Boys Hostel",
  "price": 8000,
  "type": "boys",
  "location": "Near UPES Gate 1",
  "description": "Comfortable hostel 5 mins from campus",
  "amenities": ["WiFi", "AC", "Laundry", "Hot Water"],
  "food": "yes",
  "inTime": "11pm",
  "rules": ["No smoking", "Visitors till 8 PM"],
  "ownerEmail": "owner@gmail.com",
  "ownerName": "Manu",
  "ownerPhone": "9876543210",
  "createdAt": "2026-03-08T00:00:00.000Z"
}
```

---

## ⚙️ How It Works

1. **User interacts** with the frontend (register, post listing, search)
2. **JavaScript `fetch()`** sends an HTTP request to the Vercel API
3. **Serverless function** receives the request and connects to MongoDB Atlas via Mongoose
4. **CRUD operation** is performed on the database
5. **JSON response** is sent back to the browser
6. **DOM is updated** dynamically — no page reload needed

---

## 🚀 Deployment

This project is deployed on **Vercel** with **MongoDB Atlas** as the cloud database.

### Environment Variables (set in Vercel)
```
MONGODB_URI = mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/acadiaDB
```

### Deploy Your Own
1. Fork this repository
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add `MONGODB_URI` in Environment Variables
4. Deploy!

---
Built for UPES students to make finding accommodation easier 🎓

---
