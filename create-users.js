const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('✅ Connected to MongoDB\n');

    // Delete all existing users
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    await usersCollection.deleteMany({});
    console.log('🗑️  Cleared all users\n');

    // Create properly hashed passwords
    const salt = await bcrypt.genSalt(12);
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@azino.com',
        username: 'admin',
        password: await bcrypt.hash('Admin@2024', salt),
        role: 'admin',
        permissions: [
          'books', 'courses', 'magazines', 'training', 'users', 
          'analytics', 'settings', 'authors', 'categories', 'reviews',
          'enrollments', 'contact-messages', 'training-books',
          'training-requests', 'training-followup-requests',
          'calendar', 'user-management', 'generate-ids', 'blogs'
        ],
        status: 'active',
        emailVerified: true,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Editor User',
        email: 'editor@azino.com',
        username: 'editor',
        password: await bcrypt.hash('Editor@2024', salt),
        role: 'editor',
        permissions: ['books', 'authors', 'categories', 'reviews', 'magazines', 'blogs'],
        status: 'active',
        emailVerified: true,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Regular User',
        email: 'user@azino.com',
        username: 'user',
        password: await bcrypt.hash('User@2024', salt),
        role: 'user',
        permissions: ['books', 'magazines'],
        status: 'active',
        emailVerified: true,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert directly to avoid pre-save hooks
    await usersCollection.insertMany(users);
    console.log('✅ Created 3 users with properly hashed passwords\n');

    // Verify passwords work
    console.log('🔐 Verifying passwords...\n');
    for (const user of users) {
      const dbUser = await usersCollection.findOne({ email: user.email });
      const plainPasswords = {
        'admin@azino.com': 'Admin@2024',
        'editor@azino.com': 'Editor@2024',
        'user@azino.com': 'User@2024'
      };
      
      const isValid = await bcrypt.compare(plainPasswords[user.email], dbUser.password);
      console.log(`${user.email}: ${isValid ? '✅ Password works' : '❌ Password failed'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ USERS CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nLogin with:\n');
    console.log('Admin: admin@azino.com / Admin@2024');
    console.log('Editor: editor@azino.com / Editor@2024');
    console.log('User: user@azino.com / User@2024\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createUsers();
