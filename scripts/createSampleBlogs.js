require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-all-mena', {
  dbName: process.env.DB_NAME || 'azino_publishing',
});

const sampleBlogs = [
  {
    title: "Hope For All MENA: Transforming Lives Through Education",
    titleAr: "الأمل للجميع - الشرق الأوسط وشمال أفريقيا: تحويل الحياة من خلال التعليم",
    excerpt: "Discover how Hope For All MENA is empowering communities across the Middle East and North Africa through innovative education programs and transformative initiatives.",
    excerptAr: "اكتشف كيف تقوم منظمة الأمل للجميع بتمكين المجتمعات في منطقة الشرق الأوسط وشمال أفريقيا من خلال برامج التعليم المبتكرة والمبادرات التحويلية.",
    content: `
      <h2>Our Vision for Change</h2>
      <p>At Hope For All MENA, we believe that education is the fundamental key to unlocking human potential and building stronger communities. Since our founding, we have dedicated our efforts to providing high-quality educational opportunities to underserved individuals and communities throughout the region.</p>
      
      <h3>Our Educational Programs</h3>
      <p>We offer a comprehensive range of educational programs designed to meet the diverse needs of our communities:</p>
      
      <ul>
        <li><strong>Adult Literacy Programs:</strong> Helping adults gain essential reading and writing skills</li>
        <li><strong>Vocational Training:</strong> Providing practical skills that lead to sustainable employment opportunities</li>
        <li><strong>Digital Education:</strong> Bridging the digital divide through technology literacy programs</li>
        <li><strong>School Support:</strong> Offering academic support and scholarships to students in need</li>
      </ul>
      
      <h3>Our Community Impact</h3>
      <p>Over the years, we have reached thousands of individuals and made a real difference in their lives. The success stories we witness daily confirm the power of education in transforming lives and building a better future.</p>
      
      <blockquote>
        "Education is not just a right, but the foundation upon which we build more just and prosperous societies"
      </blockquote>
      
      <h3>Join Our Journey</h3>
      <p>We invite you to join us on this transformative journey. Whether you are a volunteer, donor, or partner, your contribution helps build a better future for everyone in the Middle East and North Africa region.</p>
    `,
    contentAr: `
      <h2>رؤيتنا للتغيير</h2>
      <p>في منظمة الأمل للجميع - الشرق الأوسط وشمال أفريقيا، نؤمن بأن التعليم هو المفتاح الأساسي لفتح الإمكانات البشرية وبناء مجتمعات أقوى. منذ تأسيسنا، كرسنا جهودنا لتوفير فرص تعليمية عالية الجودة للأفراد والمجتمعات المحرومة في جميع أنحاء المنطقة.</p>
      
      <h3>برامجنا التعليمية</h3>
      <p>نقدم مجموعة شاملة من البرامج التعليمية المصممة لتلبية الاحتياجات المتنوعة لمجتمعاتنا:</p>
      
      <ul>
        <li><strong>برامج محو الأمية للكبار:</strong> نساعد البالغين على اكتساب مهارات القراءة والكتابة الأساسية</li>
        <li><strong>التدريب المهني:</strong> نوفر مهارات عملية تؤهل للحصول على فرص عمل مستدامة</li>
        <li><strong>التعليم الرقمي:</strong> نجسر الفجوة الرقمية من خلال برامج محو الأمية التكنولوجية</li>
        <li><strong>دعم التعليم المدرسي:</strong> نقدم الدعم الأكاديمي والمنح الدراسية للطلاب المحتاجين</li>
      </ul>
      
      <h3>تأثيرنا في المجتمع</h3>
      <p>على مدار السنوات الماضية، تمكنا من الوصول إلى آلاف الأفراد وإحداث تغيير حقيقي في حياتهم. قصص النجاح التي نشهدها يومياً تؤكد على قوة التعليم في تحويل الحياة وبناء مستقبل أفضل.</p>
      
      <blockquote>
        "التعليم ليس مجرد حق، بل هو الأساس الذي نبني عليه مجتمعات أكثر عدالة وازدهاراً"
      </blockquote>
      
      <h3>انضم إلى رحلتنا</h3>
      <p>ندعوك للانضمام إلينا في هذه الرحلة التحويلية. سواء كنت متطوعاً، أو مانحاً، أو شريكاً، فإن مساهمتك تساعد في بناء مستقبل أفضل للجميع في منطقة الشرق الأوسط وشمال أفريقيا.</p>
    `,
    category: 'stories',
    tags: ['education', 'transformation', 'community', 'empowerment'],
    tagsAr: ['تعليم', 'تحويل', 'مجتمع', 'تمكين'],
    status: 'published',
    featured: true,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    title: "Building Stronger Communities Through Collaboration",
    titleAr: "بناء مجتمعات أقوى من خلال التعاون",
    excerpt: "Learn how we foster collaboration and community partnerships to build stronger, more resilient communities that can face challenges together.",
    excerptAr: "تعرف على كيفية تعزيز روح التعاون والشراكة المجتمعية لبناء مجتمعات أكثر قوة ومرونة في مواجهة التحديات.",
    content: `
      <h2>The Power of Community Collaboration</h2>
      <p>In a world facing increasing challenges, community collaboration becomes more important than ever. At Hope For All, we believe that strong communities are built through collective action and effective partnerships.</p>
      
      <h3>Our Community Initiatives</h3>
      <p>We develop and implement various initiatives aimed at strengthening social cohesion:</p>
      
      <ul>
        <li><strong>Community Centers:</strong> We establish centers that bring community members together and provide safe spaces for interaction</li>
        <li><strong>Volunteer Programs:</strong> We encourage community participation through diverse volunteer opportunities</li>
        <li><strong>Training Workshops:</strong> We offer workshops to develop community leadership skills</li>
        <li><strong>Support Networks:</strong> We build strong support networks for families and individuals in need</li>
      </ul>
      
      <h3>Success Stories</h3>
      <p>We have witnessed many success stories that confirm the effectiveness of our collaborative approach. From local economic development projects to psychological and social support programs, each initiative contributes to building a stronger and more cohesive community.</p>
      
      <h3>Your Role in Change</h3>
      <p>We believe that every individual has an important role in building their community. We invite you to participate in our initiatives and contribute to the positive change we all strive for.</p>
    `,
    contentAr: `
      <h2>قوة التعاون المجتمعي</h2>
      <p>في عالم يواجه تحديات متزايدة، يصبح التعاون المجتمعي أكثر أهمية من أي وقت مضى. في منظمة الأمل للجميع، نؤمن بأن المجتمعات القوية تُبنى من خلال العمل الجماعي والشراكات الفعالة.</p>
      
      <h3>مبادراتنا المجتمعية</h3>
      <p>نعمل على تطوير وتنفيذ مبادرات متنوعة تهدف إلى تعزيز التماسك الاجتماعي:</p>
      
      <ul>
        <li><strong>مراكز المجتمع:</strong> نؤسس مراكز تجمع أفراد المجتمع وتوفر مساحات آمنة للتفاعل</li>
        <li><strong>برامج التطوع:</strong> نشجع المشاركة المجتمعية من خلال فرص التطوع المتنوعة</li>
        <li><strong>ورش التدريب:</strong> نقدم ورش عمل لتطوير مهارات القيادة المجتمعية</li>
        <li><strong>شبكات الدعم:</strong> نبني شبكات دعم قوية للأسر والأفراد المحتاجين</li>
      </ul>
      
      <h3>نماذج من النجاح</h3>
      <p>شهدنا العديد من قصص النجاح التي تؤكد على فعالية نهجنا التعاوني. من مشاريع التنمية الاقتصادية المحلية إلى برامج الدعم النفسي والاجتماعي، كل مبادرة تساهم في بناء مجتمع أقوى وأكثر تماسكاً.</p>
      
      <h3>دورك في التغيير</h3>
      <p>نؤمن بأن كل فرد لديه دور مهم في بناء مجتمعه. ندعوك للمشاركة في مبادراتنا والمساهمة في إحداث التغيير الإيجابي الذي نسعى إليه جميعاً.</p>
    `,
    category: 'news',
    tags: ['community', 'collaboration', 'partnership', 'development'],
    tagsAr: ['مجتمع', 'تعاون', 'شراكة', 'تنمية'],
    status: 'published',
    featured: false,
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    title: "Annual Impact Report 2024: Measuring Our Success",
    titleAr: "تقرير الأثر السنوي 2024: قياس نجاحنا",
    excerpt: "Review our achievements and impact throughout 2024, through numbers and stories that reflect the real change we've made in communities.",
    excerptAr: "استعرض إنجازاتنا وتأثيرنا خلال عام 2024، من خلال الأرقام والقصص التي تعكس التغيير الحقيقي الذي أحدثناه في المجتمعات.",
    content: `
      <h2>A Year of Achievements</h2>
      <p>We are pleased to share our 2024 Annual Impact Report, which highlights the important achievements we have made and the positive impact we have had on the lives of thousands of individuals and communities.</p>
      
      <h3>The Numbers Speak</h3>
      <div class="impact-stats">
        <ul>
          <li><strong>8,860 Members:</strong> Joined our various programs</li>
          <li><strong>456 Leaders:</strong> Were trained and qualified</li>
          <li><strong>55 Books:</strong> Were published and distributed to communities</li>
          <li><strong>10,000 Magazines:</strong> Were distributed to spread awareness</li>
        </ul>
      </div>
      
      <h3>Impact Stories</h3>
      <p>Behind every number is a touching human story. From young people who got jobs after vocational training, to women who became leaders in their communities, each story reflects the power of education and empowerment.</p>
      
      <h3>Challenges and Lessons Learned</h3>
      <p>The journey was not without challenges, but each challenge taught us a valuable lesson and made us stronger and wiser in facing the future. We learned the importance of flexibility and adapting to changing circumstances.</p>
      
      <h3>Looking to the Future</h3>
      <p>Based on the achievements of 2024, we look forward to 2025 with optimism and greater ambition. We have ambitious plans to expand our programs and reach more communities, focusing on sustainability and long-term impact.</p>
      
      <blockquote>
        "True success is measured by the positive impact we make in the lives of others"
      </blockquote>
      
      <h3>Thanks and Appreciation</h3>
      <p>We extend our sincere thanks to all our partners, volunteers, and donors who made these achievements possible. Without your continued support, we would not have been able to achieve this positive impact.</p>
    `,
    contentAr: `
      <h2>عام من الإنجازات</h2>
      <p>يسعدنا أن نشارككم تقرير الأثر السنوي لعام 2024، والذي يسلط الضوء على الإنجازات المهمة التي حققناها والتأثير الإيجابي الذي أحدثناه في حياة الآلاف من الأفراد والمجتمعات.</p>
      
      <h3>الأرقام تتحدث</h3>
      <div class="impact-stats">
        <ul>
          <li><strong>8,860 عضو:</strong> انضم إلى برامجنا المختلفة</li>
          <li><strong>456 قائد:</strong> تم تدريبهم وتأهيلهم</li>
          <li><strong>55 كتاب:</strong> تم نشرها ووزعت على المجتمعات</li>
          <li><strong>10,000 مجلة:</strong> تم توزيعها لنشر الوعي</li>
        </ul>
      </div>
      
      <h3>قصص التأثير</h3>
      <p>وراء كل رقم قصة إنسانية مؤثرة. من الشباب الذين حصلوا على فرص عمل بعد التدريب المهني، إلى النساء اللواتي أصبحن قائدات في مجتمعاتهن، كل قصة تعكس قوة التعليم والتمكين.</p>
      
      <h3>التحديات والدروس المستفادة</h3>
      <p>لم تكن الرحلة خالية من التحديات، لكن كل تحدٍ علمنا درساً قيماً وجعلنا أكثر قوة وحكمة في مواجهة المستقبل. تعلمنا أهمية المرونة والتكيف مع الظروف المتغيرة.</p>
      
      <h3>نظرة إلى المستقبل</h3>
      <p>بناءً على إنجازات 2024، نتطلع إلى عام 2025 بتفاؤل وطموح أكبر. لدينا خطط طموحة لتوسيع برامجنا والوصول إلى مجتمعات أكثر، مع التركيز على الاستدامة والتأثير طويل المدى.</p>
      
      <blockquote>
        "النجاح الحقيقي يُقاس بالتأثير الإيجابي الذي نحدثه في حياة الآخرين"
      </blockquote>
      
      <h3>شكر وتقدير</h3>
      <p>نتقدم بالشكر الجزيل لجميع شركائنا ومتطوعينا ومانحينا الذين جعلوا هذه الإنجازات ممكنة. بدون دعمكم المستمر، لما تمكنا من تحقيق هذا التأثير الإيجابي.</p>
    `,
    category: 'updates',
    tags: ['annual report', 'achievements', 'impact', 'success'],
    tagsAr: ['تقرير سنوي', 'إنجازات', 'تأثير', 'نجاح'],
    status: 'published',
    featured: true,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

async function createSampleBlogs() {
  try {
    console.log('Creating sample blogs with Arabic content...');
    
    // Find or create a default admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating default admin user...');
      adminUser = new User({
        name: 'Admin',
        username: 'admin',
        email: 'admin@hopeforallmena.org',
        password: 'hashedpassword', // In real scenario, this should be properly hashed
        role: 'admin'
      });
      await adminUser.save();
    }
    
    // Create blogs
    for (const blogData of sampleBlogs) {
      console.log(`Creating blog: ${blogData.title}`);
      
      // Generate slug from title
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      const blog = new Blog({
        ...blogData,
        slug,
        author: adminUser._id,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 1000) + 100, // Random views between 100-1100
        likes: Math.floor(Math.random() * 50) + 10 // Random likes between 10-60
      });
      
      await blog.save();
      console.log(`✅ Created blog: ${blog.title} (${blog.slug})`);
    }
    
    console.log('✅ Successfully created all sample blogs with Arabic content');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample blogs:', error);
    process.exit(1);
  }
}

// Run the script
createSampleBlogs();
