const mongoose = require('mongoose');
const { createSessionMiddleware, sessionUtils } = require('./config/session');
const User = require('./models/User');

async function testSessionSave() {
  try {
    console.log('🔍 Testing session save functionality...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/azino_publishing');
    console.log('✅ Connected to MongoDB');
    
    // Get a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('👤 Test user:', user.email, user._id);
    
    // Create a mock request object
    const mockReq = {
      session: {
        save: (callback) => {
          console.log('💾 Session save called');
          callback(null);
        },
        regenerate: (callback) => {
          console.log('🔄 Session regenerate called');
          callback(null);
        },
        destroy: (callback) => {
          console.log('🗑️ Session destroy called');
          callback(null);
        }
      },
      sessionID: 'test-session-' + Date.now()
    };
    
    // Test session creation
    console.log('\n🧪 Testing session creation...');
    await sessionUtils.createUserSession(mockReq, user);
    
    console.log('✅ Session creation test completed');
    
    // Test session authentication check
    console.log('\n🧪 Testing session authentication...');
    const isAuth = sessionUtils.isAuthenticated(mockReq);
    console.log('🔐 Is authenticated:', isAuth);
    
    const userId = sessionUtils.getUserId(mockReq);
    console.log('👤 User ID from session:', userId);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSessionSave();

