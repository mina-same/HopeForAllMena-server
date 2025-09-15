const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-all-mena');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test course data
const testCourseData = {
  title: "Introduction to Web Development",
  description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript. This comprehensive course covers everything from basic markup to interactive web applications. Perfect for beginners who want to start their journey in web development. You'll build real projects and gain hands-on experience with modern web technologies.",
  shortDescription: "Learn HTML, CSS, and JavaScript fundamentals in this beginner-friendly web development course.",
  category: "Technology",
  subcategory: "Web Development",
  level: "beginner",
  format: "online",
  duration: "8 weeks",
  price: 299,
  currency: "$",
  startDate: new Date("2024-10-01T09:00:00.000Z"),
  endDate: new Date("2024-11-26T17:00:00.000Z"),
  instructor: "Sarah Johnson",
  institution: {
    id: "inst_001",
    name: "Hope For All MENA Academy",
    logo: "https://example.com/logo.png",
    website: "https://hopeforallmena.org"
  },
  maxStudents: 30,
  availableSeats: 30,
  totalEnrollments: 0,
  averageRating: 4.5,
  totalRatings: 12,
  imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  prerequisites: ["Basic computer skills", "Internet access", "Willingness to learn"],
  certification: "Certificate of Completion in Web Development",
  syllabus: [
    {
      week: 1,
      title: "HTML Fundamentals",
      description: "Learn the basics of HTML markup language and document structure",
      topics: ["HTML structure", "Tags and elements", "Forms and inputs", "Semantic HTML"]
    },
    {
      week: 2,
      title: "CSS Styling",
      description: "Master CSS for styling web pages and creating responsive designs",
      topics: ["Selectors", "Box model", "Flexbox and Grid", "Responsive design"]
    },
    {
      week: 3,
      title: "JavaScript Basics",
      description: "Introduction to JavaScript programming and DOM manipulation",
      topics: ["Variables and data types", "Functions", "DOM manipulation", "Event handling"]
    },
    {
      week: 4,
      title: "Advanced JavaScript",
      description: "Learn advanced JavaScript concepts and modern ES6+ features",
      topics: ["Arrow functions", "Promises", "Async/await", "Modules"]
    },
    {
      week: 5,
      title: "Project Development",
      description: "Build your first interactive web application",
      topics: ["Project planning", "Code organization", "Testing", "Debugging"]
    }
  ],
  schedule: "Mondays and Wednesdays, 6:00 PM - 8:00 PM (GMT+3)",
  language: "English",
  tags: ["web development", "html", "css", "javascript", "beginner", "online", "certificate"],
  featured: true,
  status: "published",
  createdBy: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
};

// Add test course
const addTestCourse = async () => {
  try {
    await connectDB();
    
    // Check if test course already exists
    const existingCourse = await Course.findOne({ title: testCourseData.title });
    
    if (existingCourse) {
      console.log('Test course already exists:', existingCourse.title);
      console.log('Course ID:', existingCourse._id);
      return;
    }
    
    // Create new course
    const course = new Course(testCourseData);
    await course.save();
    
    console.log('✅ Test course created successfully!');
    console.log('Course ID:', course._id);
    console.log('Title:', course.title);
    console.log('Category:', course.category);
    console.log('Level:', course.level);
    console.log('Price:', `${course.currency}${course.price}`);
    console.log('Start Date:', course.startDate.toDateString());
    console.log('Available Seats:', course.availableSeats);
    console.log('Status:', course.status);
    console.log('Featured:', course.featured);
    
  } catch (error) {
    console.error('❌ Error creating test course:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
addTestCourse();
