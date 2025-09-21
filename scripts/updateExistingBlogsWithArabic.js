const mongoose = require('mongoose');
const Blog = require('../models/Blog');

// Load environment variables
require('dotenv').config();

// Connect to the correct database - MongoDB Atlas
const mongoUri = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const arabicContentMap = {
  "hope-for-all-mena-transforming-lives-through-education": {
    titleAr: "الأمل للجميع - الشرق الأوسط وشمال أفريقيا: تحويل الحياة من خلال التعليم",
    excerptAr: "اكتشف كيف تقوم منظمة الأمل للجميع بتمكين المجتمعات في منطقة الشرق الأوسط وشمال أفريقيا من خلال برامج التعليم المبتكرة والمبادرات التحويلية.",
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
    tagsAr: ["تعليم", "تحويل", "مجتمع", "تمكين"]
  },
  
  "community-outreach-program-building-bridges-of-hope": {
    titleAr: "برنامج التواصل المجتمعي: بناء جسور الأمل",
    excerptAr: "تعرف على برنامج التواصل المجتمعي وكيف نبني جسور الأمل والتواصل بين المجتمعات لخلق تأثير إيجابي مستدام.",
    contentAr: `
      <h2>قلب مهمتنا</h2>
      <p>يمثل برنامج التواصل المجتمعي قلب منظمة الأمل للجميع - الشرق الأوسط وشمال أفريقيا. من خلال هذا البرنامج، نسعى لبناء جسور الأمل والتواصل بين المجتمعات المختلفة، مما يخلق شبكة قوية من الدعم والتعاون.</p>
      
      <h3>أهدافنا الأساسية</h3>
      <p>نهدف من خلال برنامج التواصل المجتمعي إلى تحقيق عدة أهداف مهمة:</p>
      
      <ul>
        <li><strong>بناء الثقة:</strong> إقامة علاقات قوية ومستدامة مع المجتمعات المحلية</li>
        <li><strong>تحديد الاحتياجات:</strong> فهم التحديات الحقيقية التي تواجه كل مجتمع</li>
        <li><strong>تقديم الحلول:</strong> تطوير برامج مخصصة تلبي الاحتياجات المحددة</li>
        <li><strong>التمكين المستدام:</strong> بناء قدرات المجتمعات للاعتماد على أنفسها</li>
      </ul>
      
      <h3>نشاطاتنا المجتمعية</h3>
      <p>ننظم العديد من الأنشطة والفعاليات التي تهدف إلى تعزيز التواصل والتفاعل الإيجابي:</p>
      
      <ul>
        <li>ورش العمل التدريبية</li>
        <li>الفعاليات الثقافية والتعليمية</li>
        <li>برامج الدعم النفسي والاجتماعي</li>
        <li>مشاريع التنمية المجتمعية</li>
      </ul>
      
      <h3>قصص من الميدان</h3>
      <p>كل يوم نشهد قصص نجاح ملهمة من مجتمعاتنا. هذه القصص تؤكد على أهمية التواصل المباشر والعمل المشترك في إحداث التغيير الإيجابي.</p>
      
      <blockquote>
        "التواصل الحقيقي يبدأ بالاستماع، ويتطور بالفهم، ويثمر بالعمل المشترك"
      </blockquote>
    `,
    tagsAr: ["تواصل مجتمعي", "جسور الأمل", "تنمية", "شراكة"]
  },
  
  "annual-impact-report-2024-measuring-our-success": {
    titleAr: "تقرير الأثر السنوي 2024: قياس نجاحنا",
    excerptAr: "استعرض تقريرنا الشامل للأثر لعام 2024 الذي يعرض النتائج القابلة للقياس والتأثير الإيجابي الذي أحدثناه في منطقة الشرق الأوسط وشمال أفريقيا.",
    contentAr: `
      <h2>عام من الإنجازات المتميزة</h2>
      <p>بينما نتأمل في عام آخر من الخدمة المتفانية لمنطقة الشرق الأوسط وشمال أفريقيا، يسعدنا أن نشارككم تقرير الأثر الشامل لعام 2024. هذا التقرير يسلط الضوء على الإنجازات الملموسة والتأثير الإيجابي الذي حققناه معاً.</p>
      
      <h3>إنجازاتنا بالأرقام</h3>
      <div class="impact-stats">
        <ul>
          <li><strong>8,860 عضو نشط:</strong> انضموا إلى برامجنا المختلفة</li>
          <li><strong>456 قائد مجتمعي:</strong> تم تدريبهم وتأهيلهم</li>
          <li><strong>55 كتاب تعليمي:</strong> تم نشرها ووزعت على المجتمعات</li>
          <li><strong>10,000 مجلة توعوية:</strong> تم توزيعها لنشر الوعي</li>
        </ul>
      </div>
      
      <h3>قصص التأثير الحقيقي</h3>
      <p>وراء كل رقم من هذه الأرقام تكمن قصة إنسانية مؤثرة. من الشباب الذين حصلوا على فرص عمل بعد إكمال برامج التدريب المهني، إلى النساء اللواتي أصبحن قائدات في مجتمعاتهن، كل قصة تعكس قوة التعليم والتمكين في تحويل الحياة.</p>
      
      <h3>التحديات والدروس المستفادة</h3>
      <p>لم تكن الرحلة خالية من التحديات، لكن كل تحدٍ واجهناه علمنا درساً قيماً وجعلنا أكثر قوة وحكمة في مواجهة المستقبل. تعلمنا أهمية المرونة والتكيف مع الظروف المتغيرة، وقيمة الشراكات القوية في تحقيق الأهداف.</p>
      
      <h3>برامجنا الرئيسية</h3>
      <ul>
        <li><strong>برنامج التعليم والتدريب:</strong> وصل إلى 5,200 مستفيد</li>
        <li><strong>برنامج التمكين الاقتصادي:</strong> ساعد 2,100 شخص في إيجاد فرص عمل</li>
        <li><strong>برنامج الدعم المجتمعي:</strong> قدم المساعدة لـ 1,560 أسرة</li>
        <li><strong>برنامج القيادة الشبابية:</strong> درب 456 قائد شاب</li>
      </ul>
      
      <h3>نظرة إلى المستقبل</h3>
      <p>بناءً على إنجازات 2024 الرائعة، نتطلع إلى عام 2025 بتفاؤل وطموح أكبر. لدينا خطط طموحة لتوسيع برامجنا والوصول إلى مجتمعات أكثر، مع التركيز على الاستدامة والتأثير طويل المدى.</p>
      
      <blockquote>
        "النجاح الحقيقي يُقاس بالتأثير الإيجابي الذي نحدثه في حياة الآخرين، وبالأمل الذي نزرعه في قلوب المجتمعات"
      </blockquote>
      
      <h3>شكر وتقدير</h3>
      <p>نتقدم بالشكر الجزيل لجميع شركائنا ومتطوعينا ومانحينا والمجتمعات التي نخدمها. بدون دعمكم المستمر وثقتكم بنا، لما تمكنا من تحقيق هذا التأثير الإيجابي الرائع. معاً، نبني مستقبلاً أفضل للجميع.</p>
    `,
    tagsAr: ["تقرير سنوي", "إنجازات", "تأثير", "نجاح", "قياس الأداء"]
  }
};

async function updateExistingBlogs() {
  try {
    console.log('Connecting to azino_publishing database...');
    console.log('Updating existing blogs with Arabic content...');
    
    // Get all existing blogs
    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} existing blogs`);
    
    let updatedCount = 0;
    
    for (const blog of blogs) {
      console.log(`\nProcessing blog: "${blog.title}"`);
      console.log(`Slug: ${blog.slug}`);
      
      // Check if we have Arabic content for this blog
      const arabicContent = arabicContentMap[blog.slug];
      
      if (arabicContent) {
        console.log('✅ Arabic content found, updating...');
        
        // Update the blog with Arabic content
        blog.titleAr = arabicContent.titleAr;
        blog.excerptAr = arabicContent.excerptAr;
        blog.contentAr = arabicContent.contentAr;
        blog.tagsAr = arabicContent.tagsAr;
        
        await blog.save();
        updatedCount++;
        
        console.log(`✅ Updated "${blog.title}" with Arabic content`);
        console.log(`   Arabic Title: ${blog.titleAr}`);
      } else {
        console.log(`⚠️  No Arabic content mapping found for slug: ${blog.slug}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} blogs with Arabic content`);
    
    // Verify the updates
    console.log('\n📋 Verification - Checking updated blogs:');
    const updatedBlogs = await Blog.find({ titleAr: { $exists: true, $ne: null } });
    
    updatedBlogs.forEach((blog, index) => {
      console.log(`${index + 1}. "${blog.title}"`);
      console.log(`   Arabic: "${blog.titleAr}"`);
      console.log(`   Has Arabic content: ${blog.contentAr ? 'Yes' : 'No'}`);
      console.log(`   Arabic tags: ${blog.tagsAr ? blog.tagsAr.join(', ') : 'None'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating blogs with Arabic content:', error);
    process.exit(1);
  }
}

// Run the script
updateExistingBlogs();
