const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('+password');
    console.log(`Found ${users.length} users\n`);

    // Check each user's password
    for (const user of users) {
      console.log(`\n📧 User: ${user.email}`);
      console.log(`   Current hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NO PASSWORD'}`);
      
      // Test if current password works
      if (user.password) {
        const testPasswords = ['Admin@2024', 'Editor@2024', 'User@2024'];
        let passwordWorks = false;
        
        for (const testPwd of testPasswords) {
          const isValid = await bcrypt.compare(testPwd, user.password);
          if (isValid) {
            console.log(`   ✅ Current password works: ${testPwd}`);
            passwordWorks = true;
            break;
          }
        }
        
        if (!passwordWorks) {
          console.log(`   ❌ Password doesn't match any test password`);
        }
      }
    }

    console.log('\n🔧 Fixing passwords by updating directly with proper hashes...\n');

    // Update each user with a properly hashed password
    const updates = [
      { email: 'admin@azino.com', password: 'Admin@2024' },
      { email: 'editor@azino.com', password: 'Editor@2024' },
      { email: 'user@azino.com', password: 'User@2024' }
    ];

    for (const update of updates) {
      // Generate hash directly
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(update.password, salt);
      
      // Update user directly in database
      const result = await User.updateOne(
        { email: update.email },
        { $set: { password: hash } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${update.email} with password: ${update.password}`);
        
        // Verify it works
        const user = await User.findOne({ email: update.email }).select('+password');
        const isValid = await bcrypt.compare(update.password, user.password);
        console.log(`   Verification: ${isValid ? '✅ WORKS' : '❌ FAILED'}`);
      } else {
        console.log(`⚠️  User ${update.email} not found or not updated`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PASSWORDS FIXED!');
    console.log('='.repeat(60));
    console.log('\nYou can now login with:\n');
    console.log('Admin: admin@azino.com / Admin@2024');
    console.log('Editor: editor@azino.com / Editor@2024');
    console.log('User: user@azino.com / User@2024\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Done');
  }
}

fixPasswords();
