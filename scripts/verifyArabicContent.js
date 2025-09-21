const mongoose = require('mongoose');
const Blog = require('../models/Blog');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB Atlas
const mongoUri = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyArabicContent() {
  try {
    console.log('🔍 Verifying Arabic content in blogs...\n');
    
    const blogs = await Blog.find({}).select('title titleAr excerpt excerptAr tags tagsAr slug');
    
    console.log(`Found ${blogs.length} blogs in database:\n`);
    
    blogs.forEach((blog, index) => {
      console.log(`${index + 1}. "${blog.title}"`);
      console.log(`   Slug: ${blog.slug}`);
      console.log(`   Arabic Title: ${blog.titleAr || '❌ Missing'}`);
      console.log(`   English Excerpt: ${blog.excerpt ? blog.excerpt.substring(0, 60) + '...' : '❌ Missing'}`);
      console.log(`   Arabic Excerpt: ${blog.excerptAr ? blog.excerptAr.substring(0, 60) + '...' : '❌ Missing'}`);
      console.log(`   English Tags: [${blog.tags ? blog.tags.join(', ') : 'None'}]`);
      console.log(`   Arabic Tags: [${blog.tagsAr ? blog.tagsAr.join(', ') : 'None'}]`);
      console.log('   ---');
    });
    
    // Summary
    const blogsWithArabic = blogs.filter(blog => blog.titleAr);
    console.log(`\n📊 Summary:`);
    console.log(`   Total blogs: ${blogs.length}`);
    console.log(`   Blogs with Arabic content: ${blogsWithArabic.length}`);
    console.log(`   Completion rate: ${Math.round((blogsWithArabic.length / blogs.length) * 100)}%`);
    
    if (blogsWithArabic.length === blogs.length) {
      console.log(`\n✅ All blogs have Arabic content!`);
    } else {
      console.log(`\n⚠️  ${blogs.length - blogsWithArabic.length} blogs still need Arabic content.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying Arabic content:', error);
    process.exit(1);
  }
}

// Run the script
verifyArabicContent();
