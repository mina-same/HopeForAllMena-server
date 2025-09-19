const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Comment = require('./models/Comment');
const User = require('./models/User');
require('dotenv').config();

const testBlogs = [
  {
    title: "Hope For All MENA: Transforming Lives Through Education",
    slug: "hope-for-all-mena-transforming-lives-through-education",
    content: `Education is the cornerstone of progress and the key to unlocking human potential. At Hope For All MENA, we believe that every individual, regardless of their background or circumstances, deserves access to quality education that can transform their life and the lives of those around them.

Our mission extends beyond traditional classroom learning. We focus on holistic development that encompasses not just academic knowledge, but also life skills, critical thinking, and emotional intelligence. Through our comprehensive programs, we have witnessed countless success stories of individuals who have overcome adversity and achieved their dreams.

In the MENA region, where challenges are numerous and opportunities can be scarce, education serves as a beacon of hope. Our programs are specifically designed to address the unique needs of our communities, taking into account cultural sensitivities, local challenges, and regional opportunities.

We work closely with local communities, government institutions, and international partners to ensure that our educational initiatives are sustainable, impactful, and aligned with the long-term development goals of the region. Our approach is collaborative, inclusive, and focused on creating lasting change.

Through scholarships, vocational training, literacy programs, and leadership development initiatives, we are building a foundation for a brighter future. Every student we support, every teacher we train, and every community we serve brings us one step closer to our vision of a more educated, empowered, and prosperous MENA region.`,
    excerpt: "Discover how Hope For All MENA is transforming lives through comprehensive education programs designed specifically for the unique needs of our region.",
    category: "stories",
    tags: ["education", "transformation", "community", "empowerment"],
    status: "published",
    featured: true,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop"
  },
  {
    title: "Community Outreach Program: Building Bridges of Hope",
    slug: "community-outreach-program-building-bridges-of-hope",
    content: `Our Community Outreach Program represents the heart of Hope For All MENA's mission. Through direct engagement with local communities, we have been able to identify specific needs, develop targeted solutions, and create sustainable programs that make a real difference in people's lives.

The program operates on the principle of community-driven development, where local voices guide our initiatives and local leaders take ownership of the programs. This approach ensures that our interventions are culturally appropriate, practically relevant, and sustainable in the long term.

Over the past year, our outreach teams have visited over 150 communities across the MENA region, conducting needs assessments, facilitating community meetings, and establishing local partnerships. These visits have resulted in the launch of 45 new community-based programs, ranging from adult literacy classes to vocational training workshops.

One of our most successful initiatives has been the establishment of Community Learning Centers. These centers serve as hubs for educational activities, skill development workshops, and community gatherings. Each center is managed by trained local volunteers who understand the specific needs and dynamics of their community.

The impact of our Community Outreach Program extends beyond individual beneficiaries. By strengthening community bonds, fostering local leadership, and creating networks of support, we are contributing to the overall resilience and development of the communities we serve.

Looking ahead, we plan to expand our outreach efforts to reach even more communities while deepening our impact in existing program locations. Our goal is to create a network of empowered communities that can support each other and drive positive change from within.`,
    excerpt: "Learn about our Community Outreach Program and how we're building bridges of hope through direct community engagement and locally-driven initiatives.",
    category: "news",
    tags: ["community", "outreach", "development", "partnership"],
    status: "published",
    featured: true,
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
  },
  {
    title: "Annual Impact Report 2024: Measuring Our Success",
    slug: "annual-impact-report-2024-measuring-our-success",
    content: `As we reflect on another year of dedicated service to the MENA region, we are proud to share the significant impact that Hope For All MENA has achieved through the collective efforts of our team, partners, and the communities we serve.

This year has been marked by unprecedented growth in our programs and reach. We have successfully expanded our operations to three new countries, launched five innovative program initiatives, and directly impacted the lives of over 25,000 individuals across the region.

Our educational programs have shown remarkable success rates, with 89% of our scholarship recipients successfully completing their studies and 76% securing employment or pursuing further education within six months of graduation. These numbers represent not just statistics, but real lives transformed and futures secured.

The vocational training programs have been particularly impactful, with over 3,200 individuals completing various skill development courses. Our partnerships with local businesses and industries have resulted in a 68% job placement rate for program graduates, contributing directly to economic development in the communities we serve.

Our literacy programs have reached over 8,500 adults, with 82% of participants achieving basic literacy levels within the program duration. This achievement is particularly significant given the challenges faced by adult learners who are balancing education with work and family responsibilities.

The leadership development initiatives have produced 156 certified community leaders who are now actively engaged in driving positive change in their respective communities. These leaders serve as multipliers of our impact, extending our reach and influence far beyond our direct programming.

Financial transparency remains a cornerstone of our operations. This year, 87% of our resources were directed to program activities, with only 13% allocated to administrative costs. This efficient use of resources ensures that donor contributions have maximum impact on the ground.

Looking forward, we are committed to building on these achievements while continuously improving our programs based on lessons learned and feedback from beneficiaries. Our goal for the coming year is to reach 35,000 individuals while maintaining the high quality and effectiveness that defines our work.`,
    excerpt: "Explore our comprehensive 2024 Impact Report showcasing the measurable difference Hope For All MENA has made across the region through our various programs and initiatives.",
    category: "updates",
    tags: ["impact", "report", "achievements", "transparency"],
    status: "published",
    featured: false,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
  }
];

const testComments = [
  {
    author: {
      name: "Sarah Ahmed",
      email: "sarah.ahmed@email.com",
      website: ""
    },
    content: "This is truly inspiring! As an educator myself, I can see the tremendous impact that quality education can have on communities. Hope For All MENA's holistic approach is exactly what our region needs.",
    status: "approved"
  },
  {
    author: {
      name: "Mohammed Hassan",
      email: "m.hassan@email.com",
      website: "https://mohammadhassan.com"
    },
    content: "I've been following your work for years, and it's amazing to see how much you've grown. The focus on community-driven development is particularly impressive. Keep up the excellent work!",
    status: "approved"
  },
  {
    author: {
      name: "Fatima Al-Zahra",
      email: "fatima.alzahra@email.com",
      website: ""
    },
    content: "Thank you for sharing such detailed impact metrics. It's refreshing to see an organization that is so transparent about their results. The 89% success rate for scholarship recipients is remarkable!",
    status: "approved"
  },
  {
    author: {
      name: "Ahmad Khalil",
      email: "ahmad.khalil@email.com",
      website: ""
    },
    content: "I'm a beneficiary of one of your vocational training programs, and I can personally attest to the quality of education and support provided. Thanks to Hope For All MENA, I was able to start my own small business.",
    status: "approved"
  },
  {
    author: {
      name: "Layla Mansour",
      email: "layla.mansour@email.com",
      website: ""
    },
    content: "The Community Learning Centers have been a game-changer for our village. It's wonderful to have a space where people of all ages can come together to learn and grow. Thank you for this initiative!",
    status: "approved"
  },
  {
    author: {
      name: "Omar Qasemi",
      email: "omar.qasemi@email.com",
      website: ""
    },
    content: "How can I get involved as a volunteer? I'm particularly interested in the literacy programs for adults. This work is so important for our communities.",
    status: "pending"
  }
];

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.DB_NAME || 'azino_publishing'
    });

    console.log('✅ Connected to MongoDB');

    // Find an admin user to be the author
    let adminUser = await User.findOne({ permissions: { $in: ['user-management', 'blogs'] } });
    
    if (!adminUser) {
      console.log('⚠️  No admin user found, creating a default admin user...');
      adminUser = new User({
        name: 'Hope For All Admin',
        email: 'admin@hopeforallmena.org',
        username: 'admin',
        password: 'hashedpassword', // This should be properly hashed in production
        permissions: ['user-management', 'blogs', 'books', 'authors', 'categories', 'reviews'],
        status: 'active'
      });
      await adminUser.save();
      console.log('✅ Created admin user');
    }

    // Clear existing test data
    await Blog.deleteMany({ title: { $in: testBlogs.map(blog => blog.title) } });
    await Comment.deleteMany({ 'author.email': { $in: testComments.map(comment => comment.author.email) } });
    console.log('🧹 Cleared existing test data');

    // Create test blogs
    const createdBlogs = [];
    for (const blogData of testBlogs) {
      const blog = new Blog({
        ...blogData,
        author: adminUser._id,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 50) + 10
      });
      
      await blog.save();
      createdBlogs.push(blog);
      console.log(`✅ Created blog: ${blog.title}`);
    }

    // Create test comments
    let commentIndex = 0;
    for (const blog of createdBlogs) {
      const numComments = Math.floor(Math.random() * 3) + 1; // 1-3 comments per blog
      
      for (let i = 0; i < numComments && commentIndex < testComments.length; i++) {
        const commentData = testComments[commentIndex];
        const comment = new Comment({
          ...commentData,
          blog: blog._id,
          createdAt: new Date(blog.publishedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date after blog publication
        });
        
        await comment.save();
        console.log(`✅ Created comment by ${comment.author.name} on "${blog.title}"`);
        commentIndex++;
      }
    }

    console.log('\n🎉 Test data creation completed successfully!');
    console.log(`📊 Created ${createdBlogs.length} blog posts`);
    console.log(`💬 Created ${commentIndex} comments`);
    console.log('\nYou can now test the blog functionality:');
    console.log('1. Visit the homepage to see featured blogs');
    console.log('2. Click on blog posts to view details and comments');
    console.log('3. Try adding new comments');
    console.log('4. Access admin panel to manage blogs and comments');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

createTestData();
