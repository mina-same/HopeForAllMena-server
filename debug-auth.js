const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function debugAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('✅ Connected to MongoDB\n');

    // Test the findByEmailOrUsername method
    const identifier = 'admin@azino.com';
    const password = 'Admin@2024';
    
    console.log(`Testing login for: ${identifier}`);
    console.log(`Password: ${password}\n`);
    
    // Use the same method as the auth controller
    const user = await User.findByEmailOrUsername(identifier);
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Status:', user.status);
    console.log('  Password hash exists:', !!user.password);
    console.log('  Password hash:', user.password ? user.password.substring(0, 30) + '...' : 'NONE');
    
    // Test password comparison using the model method
    console.log('\n🔐 Testing password comparison:');
    const isValid = await user.comparePassword(password);
    console.log(`  Model method result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Test direct bcrypt comparison
    const directValid = await bcrypt.compare(password, user.password);
    console.log(`  Direct bcrypt result: ${directValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // Check if password field is actually selected
    console.log('\n📋 Checking password field selection:');
    console.log('  Password defined:', user.password !== undefined);
    console.log('  Password type:', typeof user.password);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAuth();
