const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-all-mena');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Setup Academy Course
const setupAcademy = async () => {
  try {
    await connectDB();
    
    console.log('\n🗑️  Deleting existing courses and enrollments...');
    
    // Delete all enrollments first
    const enrollmentResult = await Enrollment.deleteMany({});
    console.log(`✅ Deleted ${enrollmentResult.deletedCount} enrollment(s)`);
    
    // Delete all courses
    const courseResult = await Course.deleteMany({});
    console.log(`✅ Deleted ${courseResult.deletedCount} course(s)`);
    
    console.log('\n📚 Creating new Academy Course...');
    
    // Get first admin user for createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    // Calculate dates for 2026
    const startDate = new Date('2026-01-15T00:00:00.000Z'); // January 15, 2026
    const endDate = new Date('2026-12-31T23:59:59.999Z'); // December 31, 2026
    
    // Academy course data
    const academyCourseData = {
      title: "أكاديمية إعداد قادة خدمة الأطفال",
      titleAr: "أكاديمية إعداد قادة خدمة الأطفال",
      titleEn: "Children's Ministry Leadership Academy",
      description: `الهدف:
تمكين الجيل الجديد من خلال برنامج دبلومة "لمدة عام" يستهدف القادة من سن 18 سنة فيما فوق، ويمنحهم تدريباً متكاملاً في الأساس اللاهوتي والروحي للخدمة، مبادئ تربية الأطفال، سيكولوجية الطفل، القيادة المؤثرة، واستخدام الوسائل الإبداعية في التعليم.

الرؤية:
إنشاء أكاديمية مسيحية توفر تدريب روحي وعملي ومهاري للقادة الذين يخدمون الأطفال داخل الكنيسة، وتمكنهم من التعليم والخدمة بطرق فعالة ومبتكرة ومتجذرة كتابياً.

الفئة: خدام مدارس الأحد على مستوى الجمهورية.

نظام الدراسة:
- مدة الدراسة: عام واحد
- عدد الساعات: 120 ساعة دراسية
- نظام الدراسة: 80% أونلاين، 20% أوفلاين
- الهيكل الأكاديمي: فصلان دراسيان خلال العام - كورس صيفي مكثف - مشروع تخرج - حفل تخرج
- لغة الدراسة: اللغة العربية

شروط الدراسة:
- الالتزام بمحاضرات لقاء ZOOM بواقع ساعتان ونصف للقاء أسبوعياً. كل يوم سبت من الساعة 6م إلى الساعة 8:30م
- الالتزام بحضور كل المحاضرات offline أو online
- يسمح مرة واحدة غياب في الشهر بعذر مسبق. والذي يتكرر الغياب أكثر من مرتين في الشهر الواحد نعتذر له عن الدراسة
- الالتزام بالواجبات الفردية وتلخيص الكتب المطلوبة وتقديم الأبحاث في الموعد المحدد والعمل ضمن مجموعات وحضور ورش العمل

الشهادة:
دبلومة معتمدة بعد إجتياز البرنامج بنجاح من "International Ministry of Theology Center"`,
      descriptionAr: `الهدف:
تمكين الجيل الجديد من خلال برنامج دبلومة "لمدة عام" يستهدف القادة من سن 18 سنة فيما فوق، ويمنحهم تدريباً متكاملاً في الأساس اللاهوتي والروحي للخدمة، مبادئ تربية الأطفال، سيكولوجية الطفل، القيادة المؤثرة، واستخدام الوسائل الإبداعية في التعليم.

الرؤية:
إنشاء أكاديمية مسيحية توفر تدريب روحي وعملي ومهاري للقادة الذين يخدمون الأطفال داخل الكنيسة، وتمكنهم من التعليم والخدمة بطرق فعالة ومبتكرة ومتجذرة كتابياً.

الفئة: خدام مدارس الأحد على مستوى الجمهورية.

نظام الدراسة:
- مدة الدراسة: عام واحد
- عدد الساعات: 120 ساعة دراسية
- نظام الدراسة: 80% أونلاين، 20% أوفلاين
- الهيكل الأكاديمي: فصلان دراسيان خلال العام - كورس صيفي مكثف - مشروع تخرج - حفل تخرج
- لغة الدراسة: اللغة العربية

شروط الدراسة:
- الالتزام بمحاضرات لقاء ZOOM بواقع ساعتان ونصف للقاء أسبوعياً. كل يوم سبت من الساعة 6م إلى الساعة 8:30م
- الالتزام بحضور كل المحاضرات offline أو online
- يسمح مرة واحدة غياب في الشهر بعذر مسبق. والذي يتكرر الغياب أكثر من مرتين في الشهر الواحد نعتذر له عن الدراسة
- الالتزام بالواجبات الفردية وتلخيص الكتب المطلوبة وتقديم الأبحاث في الموعد المحدد والعمل ضمن مجموعات وحضور ورش العمل

الشهادة:
دبلومة معتمدة بعد إجتياز البرنامج بنجاح من "International Ministry of Theology Center"`,
      descriptionEn: `Objective:
Empowering the new generation through a one-year diploma program targeting leaders aged 18 and above, providing them with comprehensive training in the theological and spiritual foundation of ministry, principles of child education, child psychology, effective leadership, and the use of creative methods in teaching.

Vision:
Creating a Christian academy that provides spiritual, practical, and skill-based training for leaders who serve children in the church, enabling them to teach and serve in effective, innovative, and biblically-grounded ways.

Target Group: Sunday School servants across the Republic.

Study System:
- Study Duration: One year
- Total Hours: 120 study hours
- Study System: 80% Online, 20% Offline
- Academic Structure: Two semesters during the year - Intensive summer course - Graduation project - Graduation ceremony
- Study Language: Arabic

Study Requirements:
- Commitment to ZOOM meetings twice and a half hours per week. Every Saturday from 6 PM to 8:30 PM
- Commitment to attend all offline or online lectures
- One absence per month is allowed with prior excuse. Those who exceed two absences per month will be dismissed from the program
- Commitment to individual assignments, book summaries, research submission on time, group work, and workshop attendance

Certificate:
Accredited diploma after successfully completing the program from "International Ministry of Theology Center"`,
      shortDescription: "برنامج دبلومة لمدة عام لإعداد قادة خدمة الأطفال من خلال تدريب متكامل في الأساس اللاهوتي والروحي للخدمة",
      shortDescriptionAr: "برنامج دبلومة لمدة عام لإعداد قادة خدمة الأطفال من خلال تدريب متكامل في الأساس اللاهوتي والروحي للخدمة",
      shortDescriptionEn: "One-year diploma program to prepare children's ministry leaders through comprehensive training in theological and spiritual foundations of ministry",
      category: "خدمة الأطفال",
      categoryAr: "خدمة الأطفال",
      categoryEn: "Children's Ministry",
      subcategory: "إعداد القادة",
      subcategoryAr: "إعداد القادة",
      subcategoryEn: "Leadership Development",
      level: "intermediate",
      format: "hybrid",
      duration: "عام واحد (120 ساعة دراسية)",
      durationAr: "عام واحد (120 ساعة دراسية)",
      durationEn: "One year (120 study hours)",
      price: 900, // After support
      currency: "EGP",
      actualPrice: 5000, // Actual price
      discountedPrice: 900, // After support
      startDate: startDate,
      endDate: endDate,
      instructor: "فريق أكاديمية إعداد قادة خدمة الأطفال",
      instructorAr: "فريق أكاديمية إعداد قادة خدمة الأطفال",
      instructorEn: "Children's Ministry Leadership Academy Team",
      institution: {
        id: "academy_001",
        name: "أكاديمية إعداد قادة خدمة الأطفال",
        nameAr: "أكاديمية إعداد قادة خدمة الأطفال",
        nameEn: "Children's Ministry Leadership Academy",
        logo: "",
        website: ""
      },
      maxStudents: 100,
      availableSeats: 100,
      totalEnrollments: 0,
      averageRating: 0,
      totalRatings: 0,
      imageUrl: "",
      prerequisites: [
        "أن يكون خادم فعال أو متدرب لإعداد الخدام بالكنيسة ومشهود له",
        "ألا يقل عمر المتقدم عن 18 عاماً",
        "أن يكون حاصلًا على شهادة الثانوية العامة أو ما يعادلها",
        "ضرورة إحضار جواب تزكية من راعي الكنيسة"
      ],
      certification: "دبلومة معتمدة من International Ministry of Theology Center",
      certificateIssuer: "International Ministry of Theology Center",
      syllabus: [
        {
          week: 1,
          title: "الأسس اللاهوتية والروحية للقائد",
          description: "مستوى أول: الأساس اللاهوتي والروحي للقائد",
          topics: ["الأسس اللاهوتية", "النمو الروحي", "القيادة الروحية"]
        },
        {
          week: 2,
          title: "مبادئ المشورة للأطفال",
          description: "مستوى ثاني: مبادئ المشورة للأطفال",
          topics: ["سيكولوجية الطفل", "مبادئ المشورة", "التعامل مع الأطفال"]
        },
        {
          week: 3,
          title: "الوسائل الإبداعية في التعليم",
          description: "مستوى ثالث: استخدام الوسائل الإبداعية في التعليم",
          topics: ["الوسائل التعليمية", "الإبداع في التعليم", "طرق التدريس"]
        },
        {
          week: 4,
          title: "التخطيط الفعال للنمو والتوسع",
          description: "مستوى رابع: التخطيط الفعال للنمو والتوسع",
          topics: ["التخطيط الاستراتيجي", "النمو والتوسع", "إدارة الخدمة"]
        }
      ],
      schedule: "كل يوم سبت من الساعة 6م إلى الساعة 8:30م (ZOOM)",
      language: "العربية",
      tags: ["خدمة الأطفال", "إعداد القادة", "دبلومة", "تدريب", "لاهوت", "تربية"],
      featured: true,
      status: "published",
      // New fields
      minAge: 18,
      maxAge: 40,
      diplomaLevels: [
        {
          level: 1,
          title: "الأسس اللاهوتية والروحية للقائد",
          description: "مستوى أول: الأساس اللاهوتي والروحي للقائد"
        },
        {
          level: 2,
          title: "مبادئ المشورة للأطفال",
          description: "مستوى ثاني: مبادئ المشورة للأطفال"
        },
        {
          level: 3,
          title: "استخدام الوسائل الإبداعية في التعليم",
          description: "مستوى ثالث: استخدام الوسائل الإبداعية في التعليم"
        },
        {
          level: 4,
          title: "التخطيط الفعال للنمو والتوسع",
          description: "مستوى رابع: التخطيط الفعال للنمو والتوسع"
        }
      ],
      totalHours: 120,
      onlinePercentage: 80,
      offlinePercentage: 20,
      studyStructure: {
        semesters: 2,
        hasSummerCourse: true,
        hasGraduationProject: true,
        hasGraduationCeremony: true
      },
      weeklySchedule: {
        day: "السبت",
        startTime: "6:00 PM",
        endTime: "8:30 PM",
        duration: 150, // 2.5 hours in minutes
        platform: "ZOOM"
      },
      attendancePolicy: {
        allowedAbsencesPerMonth: 1,
        dismissalAfterAbsences: 2,
        requiresExcuse: true
      },
      paymentInstallments: {
        enabled: true,
        numberOfInstallments: 2,
        installmentAmount: 450 // 900 / 2
      },
      requiresReferenceLetter: true,
      referenceLetterFrom: "راعي الكنيسة",
      createdBy: adminUser._id
    };
    
    // Create new course
    const course = new Course(academyCourseData);
    await course.save();
    
    console.log('\n✅ Academy Course created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Course Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Course ID:', course._id);
    console.log('Title:', course.title);
    console.log('Category:', course.category);
    console.log('Level:', course.level);
    console.log('Format:', course.format);
    console.log('Duration:', course.duration);
    console.log('Total Hours:', course.totalHours);
    console.log('Online:', course.onlinePercentage + '%');
    console.log('Offline:', course.offlinePercentage + '%');
    console.log('Price (After Support):', `${course.currency} ${course.price}`);
    console.log('Actual Price:', `${course.currency} ${course.actualPrice}`);
    console.log('Installments:', course.paymentInstallments.numberOfInstallments, 'x', course.paymentInstallments.installmentAmount);
    console.log('Start Date:', course.startDate.toLocaleDateString('ar-EG'));
    console.log('End Date:', course.endDate.toLocaleDateString('ar-EG'));
    console.log('Weekly Schedule:', course.weeklySchedule.day, course.weeklySchedule.startTime, '-', course.weeklySchedule.endTime);
    console.log('Platform:', course.weeklySchedule.platform);
    console.log('Age Range:', course.minAge + ' - ' + course.maxAge);
    console.log('Diploma Levels:', course.diplomaLevels.length);
    console.log('Max Students:', course.maxStudents);
    console.log('Available Seats:', course.availableSeats);
    console.log('Language:', course.language);
    console.log('Certificate Issuer:', course.certificateIssuer);
    console.log('Requires Reference Letter:', course.requiresReferenceLetter ? 'Yes' : 'No');
    console.log('Status:', course.status);
    console.log('Featured:', course.featured);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📞 Contact Number: 01229315636');
    console.log('\n✨ Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up academy:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
setupAcademy();

