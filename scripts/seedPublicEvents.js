require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'azino_publishing';

const publicEvents = [
  {
    // Basic Information
    title: 'Community Thanksgiving Celebration 2025',
    title_ar: 'احتفال الشكر المجتمعي 2025',
    description: 'Join us for a heartwarming thanksgiving celebration filled with worship, fellowship, and community activities. This special event will feature inspirational messages, live music, children\'s activities, and a community meal. All are welcome to participate in this wonderful celebration of gratitude and hope.',
    description_ar: 'انضم إلينا في احتفال الشكر الدافئ المليء بالعبادة والشركة والأنشطة المجتمعية. سيتضمن هذا الحدث الخاص رسائل ملهمة وموسيقى حية وأنشطة للأطفال ووجبة مجتمعية. الجميع مرحب بهم للمشاركة في هذا الاحتفال الرائع بالامتنان والرجاء.',
    
    // Address & Location
    address: 'Hope Church Main Auditorium, 123 Main Street, Cairo, Egypt',
    address_ar: 'القاعة الرئيسية لكنيسة الرجاء، 123 شارع الرئيسي، القاهرة، مصر',
    location: 'https://maps.google.com/?q=Hope+Church+Cairo+Egypt',
    
    // Date & Time
    start: new Date('2025-11-20T10:00:00'),
    end: new Date('2025-11-20T14:00:00'),
    
    // Category & Status
    category: 'conference',
    status: 'confirmed',
    color: 'default',
    
    // Public Event Settings
    isPublic: true,
    isFeatured: true,
    slug: 'community-thanksgiving-celebration-2025',
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
    
    // Contact Information
    contactInfo: {
      email: 'events@hopeforallmena.org',
      phone: '+20-123-456-7890',
      whatsapp: '+20-123-456-7890',
      facebook: 'https://facebook.com/hopeforallmena',
      instagram: 'https://instagram.com/hopeforallmena'
    },
    
    // Organizer Information
    organizer: {
      name: 'Hope for All MENA Ministry',
      name_ar: 'خدمة الرجاء للجميع الشرق الأوسط وشمال أفريقيا',
      email: 'ministry@hopeforallmena.org',
      phone: '+20-123-456-7890'
    },
    
    views: 0
  },
  {
    // Basic Information
    title: 'Youth Leadership Training Workshop',
    title_ar: 'ورشة تدريب القيادة الشبابية',
    description: 'A comprehensive two-day workshop designed to equip young leaders with essential skills in ministry, communication, and community service. Participants will engage in interactive sessions, group discussions, and practical exercises led by experienced mentors. Topics include biblical leadership principles, effective communication, team building, and servant leadership.',
    description_ar: 'ورشة عمل شاملة لمدة يومين مصممة لتزويد القادة الشباب بالمهارات الأساسية في الخدمة والتواصل والخدمة المجتمعية. سيشارك المشاركون في جلسات تفاعلية ومناقشات جماعية وتمارين عملية بقيادة موجهين ذوي خبرة. تشمل المواضيع مبادئ القيادة الكتابية والتواصل الفعال وبناء الفريق والقيادة الخادمة.',
    
    // Address & Location
    address: 'Hope Training Center, 456 Corniche Road, Alexandria, Egypt',
    address_ar: 'مركز التدريب الرجاء، 456 طريق الكورنيش، الإسكندرية، مصر',
    location: 'https://maps.google.com/?q=Hope+Training+Center+Alexandria+Egypt',
    
    // Date & Time
    start: new Date('2025-12-05T09:00:00'),
    end: new Date('2025-12-06T17:00:00'),
    
    // Category & Status
    category: 'training',
    status: 'scheduled',
    color: 'green',
    
    // Public Event Settings
    isPublic: true,
    isFeatured: true,
    slug: 'youth-leadership-training-workshop-2025',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
    
    // Contact Information
    contactInfo: {
      email: 'training@hopeforallmena.org',
      phone: '+20-987-654-3210',
      whatsapp: '+20-987-654-3210',
      facebook: 'https://facebook.com/hopeforallmena',
      instagram: 'https://instagram.com/hopeforallmena'
    },
    
    // Organizer Information
    organizer: {
      name: 'Hope Youth Ministry Team',
      name_ar: 'فريق خدمة الشباب الرجاء',
      email: 'youth@hopeforallmena.org',
      phone: '+20-987-654-3210'
    },
    
    views: 0
  }
];

async function seedPublicEvents() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);

    // Get an admin user to set as createdBy
    console.log('🔍 Finding admin user...');
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('⚠️  No admin user found. Looking for any user...');
      adminUser = await User.findOne();
    }
    
    if (!adminUser) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`✅ Using user: ${adminUser.name || adminUser.email} (${adminUser._id})\n`);

    // Clear existing public events (optional - comment out if you want to keep existing events)
    // console.log('🗑️  Clearing existing public events...');
    // await Event.deleteMany({ isPublic: true });
    // console.log('✅ Cleared existing public events\n');

    // Insert the new public events
    console.log('📝 Inserting public events...\n');
    
    for (const eventData of publicEvents) {
      try {
        // Add createdBy field
        const event = new Event({
          ...eventData,
          createdBy: adminUser._id
        });
        await event.save();
        console.log(`✅ Created event: "${event.title}"`);
        console.log(`   - Slug: ${event.slug}`);
        console.log(`   - Category: ${event.category}`);
        console.log(`   - Featured: ${event.isFeatured ? 'Yes' : 'No'}`);
        console.log(`   - Start: ${event.start.toLocaleDateString()}`);
        console.log('');
      } catch (error) {
        console.error(`❌ Error creating event "${eventData.title}":`, error.message);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Total events created: ${publicEvents.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedPublicEvents();

