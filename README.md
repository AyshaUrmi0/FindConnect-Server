# FindConnect Backend Server 🔧

A robust Node.js backend server for the FindConnect platform - a community-driven application designed to help people find and recover lost items. This server provides RESTful APIs for item management, user authentication, and recovery tracking.

## 🌟 Live Demo

**Frontend**: [FindConnect Web App](https://findconnect-45273.web.app)  
**Backend API**: Deployed on Vercel

## 🎯 Purpose

FindConnect Backend serves as the core API layer for the FindConnect platform, handling:
- User authentication and session management
- Lost and found item management
- Recovery tracking and status updates
- Secure data storage and retrieval
- Cross-origin resource sharing for frontend integration

## 🛠️ Technology Stack

### Core Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB Atlas**: Cloud-based NoSQL database
- **JWT**: JSON Web Tokens for authentication
- **Vercel**: Serverless deployment platform

### Key Dependencies
- **jsonwebtoken**: JWT token generation and verification
- **cookie-parser**: Cookie parsing middleware
- **cors**: Cross-Origin Resource Sharing middleware
- **mongodb**: MongoDB driver for Node.js
- **dotenv**: Environment variable management
- **body-parser**: Request body parsing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FindConnect-Server.git
   cd FindConnect-Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   PORT=3000
   ```

4. **Start development server**
   ```bash
   node index.js
   ```

5. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## 📊 API Endpoints

### Authentication

#### `POST /jwt`
Generate JWT token for user authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true
}
```

#### `POST /logout`
Clear authentication token.

**Response:**
```json
{
  "success": true
}
```

### Items Management

#### `GET /items`
Get latest 6 items (sorted by date).

**Response:**
```json
[
  {
    "_id": "item_id",
    "postType": "lost",
    "title": "Lost Phone",
    "description": "iPhone 13 Pro",
    "category": "Electronics",
    "location": "Downtown",
    "date": "2024-01-15T10:30:00.000Z",
    "contactInfo": {
      "email": "user@example.com",
      "phone": "+1234567890"
    }
  }
]
```

#### `GET /allItems`
Get all items from the database.

#### `GET /items/:id`
Get specific item by ID.

**Parameters:**
- `id`: Item ObjectId

#### `POST /addedItems`
Add new item (inserts into both collections).

**Request Body:**
```json
{
  "postType": "lost",
  "title": "Lost Wallet",
  "description": "Brown leather wallet",
  "category": "Personal Items",
  "location": "Central Park",
  "date": "2024-01-15T10:30:00.000Z",
  "contactInfo": {
    "email": "user@example.com",
    "phone": "+1234567890"
  }
}
```

#### `GET /addedItems` (Protected)
Get user's added items (requires authentication).

**Query Parameters:**
- `email`: User's email address

**Headers:**
- `Cookie`: JWT token

#### `GET /addedItems/:id`
Get specific added item by ID.

#### `PUT /addedItems/:id`
Update item details.

**Request Body:**
```json
{
  "postType": "lost",
  "title": "Updated Title",
  "description": "Updated description",
  "category": "Electronics",
  "location": "Updated location",
  "date": "2024-01-15T10:30:00.000Z"
}
```

#### `DELETE /addedItems/:id`
Delete item from database.

### Recovery Management

#### `POST /recoveredItems`
Mark item as recovered.

**Request Body:**
```json
{
  "itemId": "item_object_id",
  "email": "user@example.com",
  "recoveryDate": "2024-01-16T10:30:00.000Z",
  "recoveryLocation": "Found at home",
  "notes": "Item was found under the couch"
}
```

#### `GET /recoveredItems`
Get recovered items by user email.

**Query Parameters:**
- `email`: User's email address

#### `PUT /recoveredItems/:id`
Update item status to recovered.

#### `PATCH /status/:id`
Update item status to recovered.

## 🔐 Security Features

### JWT Authentication
- Secure token-based authentication
- Cookie-based token storage
- Token expiration (10 hours)
- Middleware protection for sensitive routes

### CORS Configuration
- Multiple allowed origins:
  - `http://localhost:5173` (development)
  - `https://findconnect-45273.web.app` (production)
  - `https://findconnect-45273.firebaseapp.com` (Firebase)
- Credentials enabled for cross-origin requests

### Environment Variables
- Secure credential management
- Production/development environment detection
- MongoDB connection string protection

## 🗄️ Database Schema

### Collections

#### `Items`
Main collection for all lost/found items:
```javascript
{
  _id: ObjectId,
  postType: String, // "lost" or "found"
  title: String,
  description: String,
  category: String,
  location: String,
  date: Date,
  status: String, // "active" or "recovered"
  contactInfo: {
    email: String,
    phone: String
  }
}
```

#### `addedItems`
Collection for user-added items (same schema as Items).

#### `allRecoveredItems`
Collection for recovered items:
```javascript
{
  _id: ObjectId,
  itemId: ObjectId,
  email: String,
  recoveryDate: Date,
  recoveryLocation: String,
  notes: String
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `DB_USER`: MongoDB username
   - `DB_PASS`: MongoDB password
   - `JWT_SECRET`: JWT secret key
   - `NODE_ENV`: production

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables

#### Development (.env)
```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
```

#### Production (Vercel)
```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=3000
```

## 🔧 Configuration

### CORS Settings
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://findconnect-45273.web.app',
    'https://findconnect-45273.firebaseapp.com',
  ],
  credentials: true
}));
```

### MongoDB Connection
```javascript
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
```

### JWT Configuration
```javascript
const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '10h' });
```

## 📁 Project Structure

```
FindConnect-Server/
├── index.js              # Main server file
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── .env                  # Environment variables (not in repo)
└── README.md             # This file
```

## 🔍 API Testing

### Using cURL

**Generate JWT Token:**
```bash
curl -X POST http://localhost:3000/jwt \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

**Get Items:**
```bash
curl http://localhost:3000/items
```

**Add Item (with authentication):**
```bash
curl -X POST http://localhost:3000/addedItems \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_jwt_token" \
  -d '{"postType": "lost", "title": "Test Item", "description": "Test description", "category": "Electronics", "location": "Test Location", "date": "2024-01-15T10:30:00.000Z", "contactInfo": {"email": "test@example.com", "phone": "+1234567890"}}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 👥 Done By

* **Aysha Ismail** - Full Stack Developer
* **GitHub**: [AyshaUrmi0](https://github.com/AyshaUrmi0)

## 🔗 Related Repositories

- **Frontend**: [FindConnect Frontend](https://github.com/AyshaUrmi0/FindConnect.git)
- **Live Demo**: [FindConnect Web App](https://findconnect-45273.web.app)


**FindConnect Backend** - Powering the community-driven lost item recovery platform.
