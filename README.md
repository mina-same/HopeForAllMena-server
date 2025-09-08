# Azino Publishing House API

A professional backend API for the Azino Publishing House Management System built with Node.js, Express, and MongoDB.

## Features

- **User Management**: Complete CRUD operations for users
- **Authentication**: JWT-based authentication with secure login/logout
- **Authorization**: Role-based access control with permissions
- **Security**: Password hashing, rate limiting, account locking
- **Validation**: Comprehensive input validation and error handling
- **MongoDB Integration**: Mongoose ODM with advanced schema design

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator
- **Development**: nodemon for hot reloading

## Project Structure

```
server/
├── controllers/           # Business logic controllers
│   ├── authController.js  # Authentication logic
│   └── userController.js  # User management logic
├── middleware/           # Custom middleware
│   ├── auth.js          # Authentication & authorization
│   └── validation.js    # Input validation rules
├── models/              # Database models
│   └── User.js         # User model with Mongoose schema
├── routes/             # API routes
│   ├── auth.js        # Authentication routes
│   └── users.js       # User management routes
├── .env               # Environment variables
├── index.js          # Main server file
└── package.json      # Dependencies and scripts
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
DB_NAME=azino_publishing

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12

# CORS Configuration
CLIENT_URL=http://localhost:8000
```

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/login` | User login | Public |
| POST | `/logout` | User logout | Private |
| GET | `/me` | Get current user profile | Private |
| PUT | `/change-password` | Change user password | Private |
| POST | `/verify-token` | Verify JWT token | Private |
| GET | `/permissions` | Get user permissions | Private |

### User Management Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users (paginated) | Admin |
| GET | `/stats` | Get user statistics | Admin |
| GET | `/:id` | Get user by ID | Admin/Own Profile |
| POST | `/` | Create new user | Admin |
| PUT | `/:id` | Update user | Admin/Own Profile |
| DELETE | `/:id` | Delete user | Admin |
| PATCH | `/:id/status` | Update user status | Admin |
| PATCH | `/:id/permissions` | Update user permissions | Admin |
| POST | `/:id/unlock` | Unlock user account | Admin |

## API Usage Examples

### 1. User Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@publishing.com",
    "password": "AdminPass123"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "Admin User",
      "email": "admin@publishing.com",
      "username": "admin",
      "role": "Administrator",
      "permissions": ["users", "books", "analytics"],
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### 2. Create New User

```bash
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@publishing.com",
    "username": "john.doe",
    "password": "SecurePass123",
    "role": "Editor",
    "permissions": ["books", "authors"],
    "status": "active"
  }'
```

### 3. Get All Users (Paginated)

```bash
curl -X GET "http://localhost:5001/api/users?page=1&limit=10&search=john&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update User

```bash
curl -X PUT http://localhost:5001/api/users/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Smith",
    "role": "Senior Editor",
    "permissions": ["books", "authors", "categories"]
  }'
```

## User Model Schema

```javascript
{
  name: String,           // Full name (required)
  email: String,          // Email address (unique, required)
  username: String,       // Username (unique, required)
  password: String,       // Hashed password (required)
  role: String,           // User role (required)
  permissions: [String],  // Array of permissions
  status: String,         // active, inactive, suspended
  avatar: String,         // Profile picture URL
  lastLogin: Date,        // Last login timestamp
  loginAttempts: Number,  // Failed login attempts
  lockUntil: Date,        // Account lock expiration
  createdAt: Date,        // Account creation date
  updatedAt: Date         // Last update date
}
```

## Available Permissions

- `books` - Manage books and publishing
- `courses` - Manage courses and enrollments
- `magazines` - Manage magazine content
- `training` - Manage training programs
- `users` - User management (admin)
- `analytics` - View analytics and reports
- `settings` - System configuration
- `authors` - Manage authors
- `categories` - Manage categories
- `reviews` - Manage reviews
- `contact-messages` - Handle contact messages
- `calendar` - Calendar management

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 rounds
- Minimum password requirements enforced
- Password change requires current password verification

### Account Security
- Account locking after 5 failed login attempts
- 2-hour lockout period for security
- Rate limiting on sensitive operations

### JWT Security
- Secure token generation with configurable expiration
- Token verification on protected routes
- Automatic token cleanup on logout

### Input Validation
- Comprehensive validation using express-validator
- Email format validation
- Username pattern validation
- Permission validation against allowed values

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": ""
    }
  ]
}
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Login attempts: 5 attempts per 15 minutes
- Password changes: 3 attempts per 15 minutes
- User creation: 10 users per hour
- User deletion: 5 deletions per hour

## Health Check

Check if the API is running:

```bash
curl http://localhost:5001/api/health
```

**Response:**
```json
{
  "status": "success",
  "message": "Azino Publishing House API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Seeding
```bash
npm run seed
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a strong JWT secret
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use a process manager like PM2
6. Set up database backups
7. Configure monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.
