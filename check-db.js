const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'azino_publishing';
    
    console.log('Connecting to:', mongoUri);
    console.log('Database name:', dbName);
    
    await mongoose.connect(mongoUri, {
      dbName: dbName
    });
    

    
    console.log('✅ Connected to MongoDB');
    console.log('Current database:', mongoose.connection.db.databaseName);
    
    // Check users
    const users = await User.find({}).select('email username status');
    console.log('\n📊 Users in database:');
    if (users.length === 0) {
      console.log('❌ No users found!');
    } else {
      users.forEach(user => {
        console.log(`- ${user.email} (${user.username}) - Status: ${user.status}`);
      });
    }
    
    // Test finding admin user
    console.log('\n🔍 Testing findByEmailOrUsername for admin@azino.com:');
    const adminUser = await User.findByEmailOrUsername('admin@azino.com');
    if (adminUser) {
      console.log('✅ Found admin user:', adminUser.email);
    } else {
      console.log('❌ Admin user not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
