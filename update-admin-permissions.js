const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.DB_NAME || 'azino_publishing'
    });

    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@azino.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found with email: admin@azino.com');
      console.log('📝 Available users:');
      const users = await User.find({}, 'email username permissions');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.username}) - Permissions: ${user.permissions.join(', ')}`);
      });
      return;
    }

    console.log(`📋 Current permissions for ${adminUser.email}:`, adminUser.permissions);

    // Add 'blogs' permission if not already present
    if (!adminUser.permissions.includes('blogs')) {
      adminUser.permissions.push('blogs');
      await adminUser.save();
      console.log('✅ Added "blogs" permission to admin@azino.com');
    } else {
      console.log('ℹ️  User already has "blogs" permission');
    }

    console.log(`📋 Updated permissions for ${adminUser.email}:`, adminUser.permissions);

  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

updateAdminPermissions();
