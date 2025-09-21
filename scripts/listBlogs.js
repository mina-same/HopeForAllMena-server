const mongoose = require('mongoose');
const Blog = require('../models/Blog');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-all-mena', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listBlogs() {
  try {
    console.log('Fetching all blogs from database...');
    
    const blogs = await Blog.find({}).select('title slug status createdAt');
    
    if (blogs.length === 0) {
      console.log('No blogs found in database');
    } else {
      console.log(`Found ${blogs.length} blogs:`);
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. Title: "${blog.title}"`);
        console.log(`   Slug: "${blog.slug}"`);
        console.log(`   Status: ${blog.status}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching blogs:', error);
    process.exit(1);
  }
}

// Run the script
listBlogs();
