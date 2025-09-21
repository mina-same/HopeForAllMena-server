const mongoose = require('mongoose');

async function checkDatabases() {
  try {
    // Try different database names
    const dbNames = [
      'azino_publishing',
      'hope-for-all-mena',
      'hopeforallmena',
      'test'
    ];
    
    for (const dbName of dbNames) {
      console.log(`\n🔍 Checking database: ${dbName}`);
      
      try {
        // Connect to the database
        await mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   Collections found: ${collections.map(c => c.name).join(', ')}`);
        
        // Check if blogs collection exists
        const blogsCollection = collections.find(c => c.name === 'blogs');
        if (blogsCollection) {
          const Blog = mongoose.model('Blog', new mongoose.Schema({}, { strict: false }));
          const blogCount = await Blog.countDocuments();
          console.log(`   ✅ Blogs collection found with ${blogCount} documents`);
          
          if (blogCount > 0) {
            const sampleBlogs = await Blog.find({}).limit(3).select('title slug titleAr');
            console.log(`   Sample blogs:`);
            sampleBlogs.forEach(blog => {
              console.log(`     - "${blog.title}" (${blog.slug})`);
              console.log(`       Has Arabic title: ${blog.titleAr ? 'Yes' : 'No'}`);
            });
          }
        } else {
          console.log(`   ❌ No blogs collection found`);
        }
        
        await mongoose.disconnect();
      } catch (error) {
        console.log(`   ❌ Error connecting to ${dbName}: ${error.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkDatabases();
