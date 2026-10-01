// Adds Rev. Radi Atallah's articles (Arabic originals + English translations)
// and ensures an admin user exists. Safe to re-run: existing records are updated, not duplicated.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop`;
const toParagraphs = (text) =>
  text.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `<p>${l}</p>`).join('\n');
// The Arabic originals are written as short broken lines; join them into paragraphs,
// ending a paragraph where a line ends a sentence (or a verse reference / heading).
const toArabicParagraphs = (text) => {
  const paragraphs = [];
  let current = [];
  for (const line of text.trim().split('\n').map((l) => l.trim()).filter(Boolean)) {
    current.push(line);
    if (/[.؟?!:)]$|<\/strong>$/.test(line)) {
      paragraphs.push(current.join(' '));
      current = [];
    }
  }
  if (current.length) paragraphs.push(current.join(' '));
  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
};
const slugify = (title) => title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

const posts = [
  {
    title: 'Not Every Spirit Is from God',
    titleAr: 'ليس كل روحٍ من الله',
    image: img('1507692049790-de58290a4334'),
    tags: ['discernment', 'truth', 'church', 'Holy Spirit'],
    tagsAr: ['التمييز', 'الحق', 'الكنيسة', 'الروح القدس'],
    excerpt: 'In an age crowded with voices, the most dangerous thing we can do is trust every voice that raises the name of God. John calls the church to test the spirits.',
    excerptAr: 'في زمنٍ تزدحم فيه الأصوات أخطر ما يمكن أن يفعله الإنسان هو أن يمنح ثقته لكل صوتٍ يرفع اسم الله.',
    content: `
In an age crowded with voices, the most dangerous thing a person can do is give their trust to every voice that raises the name of God.
Not every religious word is true, not every spiritual tone is evidence of the Holy Spirit's presence, and not everyone who speaks about Christ necessarily speaks from Christ.
That is why the words of the apostle John come as an alarm bell for the church: "Beloved, do not believe every spirit, but test the spirits, whether they are of God; because many false prophets have gone out into the world" (1 John 4:1).
Notice that John does not say "believe no one." He says "do not believe every spirit." Christian faith is not spiritual naivety, and discernment is not doubting God. A mature church neither rejects everything nor accepts everything. It tests.
The context of the letter shows that the test begins with Christ: "Every spirit that confesses that Jesus Christ has come in the flesh is of God" (1 John 4:2). The standard is not the speaker's power or fame, nor the number of followers, nor emotional impact. It is the truth of Christ revealed in the Gospel.
Moreover, the Spirit who is from God does not lead people to glorify a man instead of Christ, nor to twist the truth to please people, nor to exploit fear, greed, and need. The Holy Spirit does not compete with the Word of God or contradict it. He leads into truth and glorifies Christ.
Here lies the church's responsibility in the information age: to teach its people how to discern, not merely how to listen. The absence of biblical teaching creates a vacuum that is filled by the most sensational voices, not necessarily the most faithful.
The problem is not that the world talks too much. The problem is that the church may hear much without testing.
So before you ask, "Is this message moving?" ask: Is it biblical? Does it glorify Christ? Does it proclaim the truth, or does it make followers for the speaker? Does it bear the fruit of holiness, love, and obedience?
In a time when any voice can reach millions, the gift of spiritual discernment becomes a necessity, not a luxury.
Not every voice is from heaven, and not everything that looks spiritual is holy.
Test the spirits, for the safety of the church begins when it learns to discern the voice of God amid the noise of many voices.
Rev. Radi Atallah`,
    contentAr: `
في زمنٍ تزدحم فيه الأصوات أخطر ما يمكن أن يفعله الإنسان هو أن يمنح ثقته لكل صوتٍ يرفع اسم الله.
فليست كل كلمة دينية حقًا
ولا كل نبرة روحية دليلًا على حضور الروح القدس ولا كل من يتكلم عن المسيح يتكلم بالضرورة من المسيح.
لهذا تأتي كلمات الرسول يوحنا كجرس إنذار للكنيسة «أَيُّهَا الأَحِبَّاءُ، لَا تُصَدِّقُوا كُلَّ رُوحٍ، بَلِ امْتَحِنُوا الأَرْوَاحَ
هَلْ هِيَ مِنَ اللهِ؟
لأَنَّ أَنْبِيَاءَ كَذَبَةً كَثِيرِينَ قَدْ خَرَجُوا إِلَى الْعَالَمِ» (1 يوحنا 1:4).
لاحظ أن يوحنا لا يقول «لا تصدقوا أحدًا»
بل يقول «لا تصدقوا كل روح».
فالإيمان المسيحي ليس سذاجة روحية
والتمييز ليس شكًا في الله.
الكنيسة الناضجة لا ترفض كل شيء
ولا تقبل كل شيء
بل تمتحن.
وسياق الرسالة يكشف أن الاختبار يبدأ من المسيح «كُلُّ رُوحٍ يَعْتَرِفُ بِيَسُوعَ الْمَسِيحِ أَنَّهُ قَدْ جَاءَ فِي الْجَسَدِ فَهُوَ مِنَ اللهِ» (1 يوحنا 2:4).
فالمعيار ليس قوة المتكلم ولا شهرته
ولا عدد أتباعه
ولا تأثيره العاطفي
بل حقيقة المسيح التي أعلنها الإنجيل.
ثم إن الروح الذي من الله لا يقود إلى تمجيد الإنسان بدل المسيح
ولا إلى تحريف الحق لإرضاء الناس
ولا إلى استغلال الخوف والجشع والاحتياج. فالروح القدس لا ينافس كلمة الله ولا يناقضها
بل يقود إلى الحق
ويُمجّد المسيح.
وهنا تكمن مسؤولية الكنيسة في عصر المعلومات
أن تُعلِّم شعبها كيف يميز لا أن تعلّمه فقط كيف يستمع.
فغياب التعليم الكتابي يخلق فراغًا تملؤه الأصوات الأكثر إثارة
لا بالضرورة الأكثر أمانة.
ليست المشكلة أن العالم يتكلم كثيرًا
المشكلة أن الكنيسة قد تسمع كثيرًا دون أن تمتحن.
لذلك قبل أن تسأل «هل هذا الكلام مؤثر؟»
اسأل
هل هو كتابي؟
هل يمجّد المسيح؟
هل يعلن الحق أم يصنع تابعين للمتكلم؟
هل يثمر قداسة ومحبة وطاعة؟
ففي زمنٍ يمكن فيه لأي صوت أن يصل إلى الملايين، تصبح موهبة التمييز الروحي ضرورة
لا رفاهية.
ليس كل صوتٍ من السماء وليس كل ما يبدو روحيًا مقدسًا.
امتحنوا الأرواح
لأن أمان الكنيسة يبدأ حين تتعلم أن تميّز صوت الله وسط ضجيج الأصوات.
القس راضي عطالله`
  },
  {
    title: 'Slander Does Not Make Truth',
    titleAr: 'الافتراء لا يصنع الحقيقة',
    image: img('1444703686981-a3abbc4d4fe3'),
    tags: ['slander', 'identity', 'forgiveness', 'peace'],
    tagsAr: ['الافتراء', 'الهوية', 'الغفران', 'السلام'],
    excerpt: 'Not every word said about you is true, and not every accusation can become your destiny. Know your worth from God, not from the tongues of people.',
    excerptAr: 'ليست كل كلمة تُقال عنك حقيقة وليست كل تهمة تُوجَّه إليك قادرة أن تصبح مصيرًا.',
    content: `
"Like a flitting sparrow, like a flying swallow, so a curse without cause shall not alight" (Proverbs 26:2).
In a world where tongues are full of judgments and defamation travels faster than truth, this verse gives the heart a deep peace: not every word said about you is true, and not every accusation aimed at you can become your destiny.
The sparrow flits away and the swallow flies, so a curse without cause finds no place to land. In the same way, an evil word that does not rest on truth, however loud it becomes, remains powerless to create the truth.
Christ Himself experienced the bitterness of accusation and slander. They said things about Him that were not in Him and distorted His image, but He did not let their lies define His identity, because He knew who He was before the Father.
Here lies spiritual maturity: to know your worth from God, not from the tongues of people. If the criticism is true, accept it humbly and fix what needs fixing. If it is slander, do not give it more of your heart than it deserves.
What hurts is not that people talk, but that we come to live inside their words and carry their accusations with us everywhere.
So do not answer a curse with a curse or an offense with an offense. Scripture says, "Bless those who persecute you; bless and do not curse" (Romans 12:14).
Leave the matter to God. The truth does not need shouting, and God is not unaware of your heart.
Do not carry other people's words on your back. If they are without cause, let them fly away like the swallow. As for you, abide in Christ, because the One who knows the truth about you is the only One able to keep you.
Rev. Radi Atallah`,
    contentAr: `
«كَالْعُصْفُورِ لِلْفَرَارِ وَكَالسُّنُونَةِ لِلطَّيَرَانِ، كَذلِكَ لَعْنَةٌ بِلاَ سَبَبٍ لاَ تَأْتِي» (أمثال 2:26).
في عالمٍ امتلأت فيه الألسنة بالأحكام وأصبح التشهير أسرع من الحقيقة تأتي هذه الآية لتمنح القلب سلامًا عميقًا ليست كل كلمة تُقال عنك حقيقة وليست كل تهمة تُوجَّه إليك قادرة أن تصبح مصيرًا.
العصفور يفر
والسنونة تطير
فلا تجد اللعنة بلا سبب مكانًا تستقر فيه.
وهكذا الكلمة الشريرة التي لا تستند إلى حق مهما ارتفع صوتها
تظل عاجزة عن صناعة الحقيقة.
لقد اختبر المسيح نفسه مرارة الاتهام والافتراء. قالوا عنه ما ليس فيه وشوّهوا صورته
لكنه لم يسمح لأكاذيبهم أن تعرّف هويته
لأنه كان يعرف من هو أمام الآب.
وهنا يكمن النضج الروحي
أن تعرف قيمتك من الله لا من ألسنة الناس.
إن كان النقد حقًا
فاقبله بتواضع
وأصلح ما يحتاج إلى إصلاح.
وإن كان افتراءً
فلا تمنحه من قلبك أكثر مما يستحق.
المؤلم ليس أن يتكلم الناس
بل أن نسكن نحن داخل كلماتهم
فنحمل اتهاماتهم معنا إلى كل مكان.
لذلك لا ترد اللعنة بلعنة ولا الإساءة بإساءة.
يقول الكتاب «بَارِكُوا عَلَى الَّذِينَ يَضْطَهِدُونَكُمْ. بَارِكُوا وَلاَ تَلْعَنُوا» (رومية 14:12).
اترك الأمر لله
فالحق لا يحتاج إلى صراخ
والله لا يجهل قلبك.
لا تحمل كلمات الآخرين على ظهرك.
إن كانت بلا سبب
دعها تطير كالسنونة.
أما أنت، فاثبت في المسيح
لأن الذي يعرف حقيقتك
هو وحده القادر أن يحفظك.
القس راضي عطالله`
  },
  {
    title: 'When Truth Falls in the Street',
    titleAr: 'حين يسقط الصدق في الشارع',
    image: img('1517732306149-e8f829eb588a'),
    tags: ['truth', 'integrity', 'society', 'church'],
    tagsAr: ['الصدق', 'الاستقامة', 'المجتمع', 'الكنيسة'],
    excerpt: 'Perhaps lying is no longer the biggest problem of our time. The greater danger is that we have learned to live with it without feeling ashamed.',
    excerptAr: 'ربما لم يعد الكذب هو المشكلة الكبرى في زماننا المشكلة الأخطر أننا تعلّمنا كيف نعيش معه دون أن نشعر بالخجل.',
    content: `
Perhaps lying is no longer the biggest problem of our time. The greater danger is that we have learned to live with it without feeling ashamed.
Some societies do not collapse when their buildings are torn down, but when the meanings on which their lives were built collapse. When lying becomes acceptable, hypocrisy becomes cleverness, evading the truth becomes a skill, and silence before wrongdoing becomes a kind of wisdom, something more dangerous than corruption has happened: the sense that truth is necessary has died.
That is why the words of Isaiah come like a cry in the face of our age: "For truth has fallen in the street, and equity cannot enter" (Isaiah 59:14).
Notice the precision of the image. Truth did not merely disappear; it fell in the street. Uprightness was not only driven out; it could not enter. It is as if truth stands at the doors of society, knocking, and finds no one to open.
Isaiah is not describing a passing moral crisis. He is exposing a deep spiritual disease. When a person is separated from God, they do not only lose their relationship with God; truth itself begins to collapse in their life. That is why the passage says, "Your iniquities have separated you from your God."
The tragedy is not that lying exists, but that lying becomes normal. It is not that injustice exists, but that injustice becomes familiar. It is not that a person falls, but that truth falls out of their reckoning and they then justify their fall.
Even more dangerous is when hypocrisy becomes a social language and self-interest becomes the measure of truth. We say what serves us, hide what condemns us, praise those we need, and fall silent when speaking up is costly.
But the Bible does not present truth as merely a moral value. At the heart of the Christian revelation, truth is a Person: "I am the way, the truth, and the life." Restoring honesty, therefore, is not just a moral campaign; it is a return to Christ.
Here comes the responsibility of the church. Its calling is not to condemn the street from a distance, but to display a different model within it: a church that is honest in its leadership, faithful with its money, upright in its relationships, courageous in proclaiming the truth, and consistent between what it preaches and how it lives.
We may not be able to fix the whole street, but we can keep truth from falling in our own street.
Revival does not begin when the people around us change, but when we refuse to grow used to the fall of truth.
Rev. Radi Atallah`,
    contentAr: `
ربما لم يعد الكذب هو المشكلة الكبرى في زماننا المشكلة الأخطر أننا تعلّمنا كيف نعيش معه دون أن نشعر بالخجل
هناك مجتمعات لا تنهار عندما تُهدم مبانيها
بل عندما تنهار المعاني التي كانت تقيم عليها حياتها.
وحين يصبح الكذب مقبولًا
والنفاق ذكاءً
والالتفاف على الحق مهارة
والصمت أمام الخطأ نوعًا من الحكمة
يكون شيء أخطر من الفساد قد حدث
لقد مات الإحساس بضرورة الحق.
لهذا تأتي كلمات إشعياء كأنها صرخة في وجه عصرنا «لأَنَّ الصِّدْقَ سَقَطَ فِي الشَّارِعِ، وَالاسْتِقَامَةَ لاَ تَسْتَطِيعُ الدُّخُولَ» (إشعياء ٥٩: ١٤).
لاحظ دقة الصورة الصدق لم يختفِ فقط
بل سقط في الشارع. والاستقامة لم تُطرد فحسب
بل لم تستطع الدخول. كأن الحق يقف أمام أبواب المجتمع
يطرق
فلا يجد من يفتح له.
إشعياء لا يصف أزمة أخلاقية عابرة
بل يكشف مرضًا روحيًا عميقًا.
فالإنسان حين ينفصل عن الله لا يفقد علاقته بالله فقط
بل يبدأ الحق نفسه في الانهيار داخل حياته. ولهذا يقول النص «آثامكم صارت فاصلة بينكم وبين إلهكم».
المأساة
ليست أن يوجد الكذب بل أن يصبح الكذب طبيعيًا.
وليست أن يوجد الظلم بل أن يصبح الظلم مألوفًا.
وليست أن يسقط الإنسان بل أن يسقط الحق من حساباته ثم يبرر سقوطه.
والأخطر أن يتحول النفاق إلى لغة اجتماعية وأن تصبح المصلحة معيارًا للحقيقة
نقول ما يخدمنا
ونخفي ما يديننا
ونمدح من نحتاجه ونصمت حين يكون الكلام مكلفًا.
لكن الكتاب المقدس لا يقدم الحق باعتباره مجرد قيمة أخلاقية
فالحق في قلب الإعلان المسيحي هو شخص
«أنا هو الطريق والحق والحياة».
لذلك فإن استعادة الصدق ليست حملة أخلاقية فحسب
بل عودة إلى المسيح.
وهنا تأتي مسؤولية الكنيسة.
ليست دعوتها أن تدين الشارع من بعيد
بل أن تُظهر في داخله نموذجًا مختلفًا
كنيسة صادقة في قيادتها
أمينة في مالها
مستقيمة في علاقاتها شجاعة في إعلان الحق ومتسقة بين ما تعظ به وما تعيشه.
ربما لا نستطيع إصلاح الشارع كله
لكن نستطيع أن نمنع الصدق من السقوط في شارعنا نحن.
فالنهضة لا تبدأ حين يتغير الناس من حولنا
بل حين نرفض نحن أن نعتاد سقوط الحق.
القس راضي عطالله`
  },
  {
    title: 'When the Church Rejects Knowledge, the People Perish',
    titleAr: 'حين ترفض الكنيسة المعرفة يهلك الشعب',
    image: img('1504052434569-70ad5836ab65'),
    tags: ['knowledge', 'Bible study', 'discipleship', 'church'],
    tagsAr: ['المعرفة', 'دراسة الكتاب', 'التلمذة', 'الكنيسة'],
    excerpt: 'Not every disaster begins with a visible collapse. Some begin with a mind that has closed its door to knowledge. A call from Hosea 4:6 to wake the church.',
    excerptAr: 'ليست كل كارثة تبدأ بانهيارٍ ظاهر، بعضها يبدأ بعقلٍ أغلق بابه أمام المعرفة.',
    content: `
"My people are destroyed for lack of knowledge. Because you have rejected knowledge…" (Hosea 4:6)
Not every disaster begins with a visible collapse. Some begin with a mind that has closed its door to knowledge. Hosea did not say the people perished because they did not hear, but because they lost knowledge. And worse, this loss was not an innocent inability but the result of deliberate rejection: "because you have rejected knowledge."
In context, knowledge is not an accumulation of religious information or the memorization of texts. It is the knowledge of God that produces relationship, faithfulness, and obedience. So the crisis was not only a lack of teaching, but a separation between knowledge and life. A person can know many verses, hold a church title, and take part in meetings while their life remains a stranger to the will of God.
Strikingly, God directs His words first to the priest: "because you have rejected knowledge." The ignorance of the people is not always the people's responsibility alone. Sometimes it reflects a failure of leadership to teach, the reduction of faith to rituals, or the replacement of true discipleship with church activity that does not change people.
A church that stops deep biblical teaching does not remain neutral. It leaves a vacuum that other ideas will fill. When biblical knowledge is absent, superstition, shallowness, and fanaticism spread easily, and the loudest voice becomes more important than the voice of truth.
So God's call today is not to more noise, but to a serious return to the Word. Let the church begin with sincere repentance for every neglect of teaching. Let it reclaim the pulpit as a place where truth is proclaimed. Let it make Bible study an essential part of the life of families, youth, and servants. And let teaching move from information that is heard to a life that is lived, from a weekly lesson to daily discipleship.
Let every church honestly ask itself: Are we making disciples who know God, or just attendees who know the meeting times?
The practical call is clear: open the Bible, study it seriously, teach it faithfully, live it out, and raise a generation that does not only know what God says, but knows God Himself and lives in obedience to Him.
True revival does not begin when the halls are full, but when hearts are filled with the knowledge of God. When the church regains its passion for the Word, knowledge can turn from light on the page into light in life.
Do not let Hosea 4:6 become a description of our generation. Make it a call to awaken the church.
A church is not measured only by the number of its meetings, the size of its buildings, or the abundance of its activities, but by the depth of its knowledge of God and the fruit of that knowledge in its life.
When the church rejects knowledge, ignorance does not disappear. Ignorance begins to lead the church.
Rev. Radi Atallah`,
    contentAr: `
«قَدْ هَلَكَ شَعْبِي مِنْ عَدَمِ الْمَعْرِفَةِ، لأَنَّكَ أَنْتَ رَفَضْتَ الْمَعْرِفَةَ…» (هوشع ٤: ٦)
ليست كل كارثة تبدأ بانهيارٍ ظاهر
بعضها يبدأ بعقلٍ أغلق بابه أمام المعرفة.
لم يقل هوشع إن الشعب هلك لأنه لم يسمع
بل لأنه فقد المعرفة والأخطر أن فقدان المعرفة لم يكن عجزًا بريئًا بل نتيجة رفضٍ متعمد
«لأَنَّكَ أَنْتَ رَفَضْتَ الْمَعْرِفَةَ».
في السياق المعرفة ليست تراكمًا للمعلومات الدينية ولا حفظًا للنصوص
بل معرفة الله التي تصنع علاقة وأمانة وطاعة. لذلك فإن الأزمة لم تكن في نقص التعليم وحده بل في انفصال المعرفة عن الحياة.
يمكن للإنسان أن يعرف آيات كثيرة
ويحمل لقبًا كنسيًا ويشارك في الاجتماعات بينما تظل حياته غريبة عن إرادة الله.
واللافت أن الله يوجّه كلامه أولًا إلى الكاهن «لأَنَّكَ أَنْتَ رَفَضْتَ الْمَعْرِفَةَ».
فجهل الشعب ليس دائمًا مسؤولية الشعب وحده أحيانًا يكون انعكاسًا لفشل القيادة في التعليم أو اختزال الإيمان في طقوس أو استبدال التلمذة الحقيقية بنشاط كنسي
لا يغيّر الإنسان.
إن الكنيسة التي تتوقف عن التعليم الكتابي العميق لا تبقى محايدة
إنها تترك فراغًا ستملؤه أفكار أخرى.
وحين تغيب المعرفة الكتابية يسهل أن تنتشر الخرافة والسطحية والتعصب
وأن يصبح الصوت الأعلى أهم من صوت الحق.
لذلك فإن دعوة الله اليوم ليست إلى مزيد من الضجيج بل إلى عودة جادة إلى الكلمة.
لتبدأ الكنيسة بتوبة صادقة عن كل إهمال للتعليم ولتسترد المنبر ليكون موضع إعلان للحق ولتجعل دراسة الكتاب جزءًا أصيلًا من حياة الأسرة والشباب والخدام.
وليتحول التعليم من معلومة تُسمع إلى حياة تُعاش
ومن درس أسبوعي إلى تلمذة يومية.
ولتسأل كل كنيسة نفسها بصدق
هل نحن نصنع تلاميذ يعرفون الله
أم مجرد حضورٍ يعرف مواعيد الاجتماعات؟
إن الدعوة العملية واضحة
افتحوا الكتاب
ادرسوه بجدية
علّموه بأمانة
اختبروه في الحياة
وربّوا جيلًا لا يعرف فقط ما يقوله الله
بل يعرف الله نفسه ويعيش في طاعته.
فالنهضة الحقيقية لا تبدأ حين تمتلئ القاعات
بل حين تمتلئ القلوب بمعرفة الله.
وعندما تستعيد الكنيسة شغفها بالكلمة
يمكن للمعرفة أن تتحول من نورٍ على الصفحات إلى نورٍ في الحياة.
لا تسمحوا أن يصبح هوشع ٤: ٦ وصفًا لجيلنا اجعلوه نداءً لإيقاظ الكنيسة.
فالكنيسة لا تُقاس فقط بعدد اجتماعاتها
ولا بحجم مبانيها
ولا بكثرة أنشطتها
بل بعمق معرفتها بالله
وثمار هذه المعرفة في حياتها.
حين ترفض الكنيسة المعرفة
لا يختفي الجهل
بل يبدأ الجهل في قيادة الكنيسة.
القس راضي عطالله`
  },
  {
    title: "You Don't Have to Drink the Whole Sea to Know It's Salty",
    titleAr: 'لا تشرب ماء البحر كله لتتأكد أنه مالح',
    image: img('1505142468610-359e7d316be0'),
    tags: ['forgiveness', 'boundaries', 'wisdom', 'discernment'],
    tagsAr: ['الغفران', 'الحدود', 'الحكمة', 'التمييز'],
    excerpt: 'Forgiveness is a virtue, but naivety is not. You can free your heart from someone who hurt you without handing them the key to your life again.',
    excerptAr: 'الغفران فضيلة، لكن السذاجة ليست فضيلة. أستطيع أن أحرر قلبي منك دون أن أعطيك مفتاح حياتي.',
    content: `
One of the deepest deceptions a person can fall into is thinking that forgiveness means giving the offender an open opportunity to offend again.
As Christians we have learned to forgive: "And forgive us our debts, as we forgive our debtors." But Christ never told us to switch off our minds in the name of love, or to chase after those who hurt us in the name of forgiveness.
Forgiveness is a virtue, but naivety is not.
There is a difference between forgiving you and placing myself within reach of your harm again. I can free my heart from you without giving you the key to my life. I can pray for you without allowing you to destroy me. I can love you from a distance and wish you salvation while setting clear boundaries around your behavior.
Christ said, "If your brother sins against you, go and tell him his fault between you and him alone" (Matthew 18:15). Notice: Christ did not ignore the offense; He confronted it.
Biblical love does not mean letting someone crush me to prove I am a good Christian. The God who said "Love your enemies" is the same God who gave us wisdom to distinguish between the repentant and the deceiver, between the weak person who fell and the deliberate one who has made hurting others a way of life.
Scripture says, "The simple believes every word, but the prudent considers well his steps" (Proverbs 14:15).
True repentance produces change, not just an apology. So do not let words deceive you when actions shout the opposite. Do not judge a person by their apology alone; watch the fruit of their life. "You will know them by their fruits" (Matthew 7:16).
Here is the hard spiritual application. If someone hurts you, do not rush to take revenge, and do not rush to restore trust either. Forgive first, then observe. Pardon, then discern. Give room for repentance, not a license to repeat the offense. Do not let the hurt create bitterness in you, but do not let it teach you naivety either.
And if someone repeatedly hurts you, ask yourself before God: Do I truly love them, or am I afraid to set boundaries? Have I forgiven them, or am I afraid of losing them? Did I give them a chance to change, or a new chance to hurt me? Does their presence in my life help me grow in Christ, or does it quench what God is building in me?
Sometimes holiness means saying, "I forgive you, but I will not allow this to happen to me again." And sometimes spiritual wisdom means leaving a harmful relationship without hatred, closing a door without closing your heart, and stepping away without becoming an enemy.
You are not required to drink the whole sea to make sure it is salty. The first sip is enough to know the truth, and wisdom is enough to keep you from repeating the experience in the name of love.
Forgive, because Christ forgave you. But learn, because God gave you a mind. Set boundaries, because your body, your soul, and your life are a trust. And move forward, because God does not call you to spend the rest of your life standing before a door that hurts you, while other doors lie open before you by His grace.
Forgiveness frees your heart from the offender. Discernment protects your life from repeated harm. And grace gives you the strength to do both without bitterness.
Rev. Radi Atallah`,
    contentAr: `
من أعمق الخدع التي يمكن أن يقع فيها الإنسان أن يظن أن الغفران يعني أن يمنح المسيء فرصة مفتوحة لإعادة الإساءة.
نحن كمسيحيين تعلّمنا أن نغفر «وَاغْفِرْ لَنَا ذُنُوبَنَا كَمَا نَغْفِرُ نَحْنُ أَيْضًا لِلْمُذْنِبِينَ إِلَيْنَا».
لكن المسيح لم يقل لنا ألغوا عقولكم باسم المحبة
ولاحِقوا من يؤذيكم باسم الغفران.
الغفران فضيلة
لكن السذاجة ليست فضيلة.
هناك فرق بين أن أغفر لك وبين أن أضع نفسي مرة أخرى في متناول أذاك. أستطيع أن أحرر قلبي منك دون أن أعطيك مفتاح حياتي.
أستطيع أن أصلي لأجلك دون أن أسمح لك بتدميري.
أستطيع أن أحبك من بعيد وأن أتمنى لك الخلاص بينما أضع حدودًا واضحة أمام سلوكك.
قال المسيح
«إِنْ أَخْطَأَ إِلَيْكَ أَخُوكَ فَاذْهَبْ وَعَاتِبْهُ بَيْنَكَ وَبَيْنَهُ وَحْدَكُمَا» (متى 18: 15). لاحظ
المسيح لم يتجاهل الإساءة بل واجهها.
المحبة الكتابية ليست أن أسمح للآخر أن يحطمني حتى أثبت أنني مسيحي صالح.
فالله الذي قال «أَحِبُّوا أَعْدَاءَكُمْ»
هو نفسه الذي أعطانا الحكمة لنميز بين التائب والمخادع
وبين الضعيف الذي سقط والمتعمد الذي جعل من إيذاء الآخرين أسلوب حياة.
والكتاب يقول «اَلْغَبِيُّ يُصَدِّقُ كُلَّ كَلِمَةٍ، وَالذَّكِيُّ يَنْتَبِهُ إِلَى خَطَوَاتِهِ» (الأمثال 15:14).
التوبة الحقيقية تُنتج تغييرًا لا مجرد اعتذار.
لذلك لا تجعل الكلمات تخدعك حين تكون الأفعال تصرخ بعكسها.
لا تحكم على الإنسان من اعتذاره فقط بل راقب ثمر حياته.
«مِنْ ثِمَارِهِمْ تَعْرِفُونَهُمْ» (متى 7: 16).
وهنا التطبيق الروحي الصعب
إذا أساء إليك شخص
لا تسارع إلى الانتقام
ولا تسارع أيضًا إلى إعادة الثقة.
اغفر أولًا ثم راقب.
سامح، ثم ميّز.
أعطِ فرصة للتوبة
لا تصريحًا بتكرار الجريمة.
لا تسمح للإساءة أن تصنع في داخلك مرارة لكن لا تسمح لها أيضًا أن تعلمك السذاجة.
وإذا كان هناك شخص يتكرر منه الأذى
فاسأل نفسك أمام الله
هل أنا أحبه فعلًا
أم أنني أخاف أن أضع له حدودًا؟
هل غفرت له
أم أنني أخاف فقدانه؟
هل أعطيته فرصة للتغيير أم أعطيته فرصة جديدة لإيذائي؟
هل وجوده في حياتي يساعدني أن أنمو في المسيح
أم يطفئ فيَّ ما يبنيه الله؟
أحيانًا تكون القداسة في أن تقول «أغفر لك، لكن لن أسمح بتكرار هذا معي.»
وأحيانًا تكون الحكمة الروحية أن تخرج من علاقة مؤذية دون كراهية وأن تغلق بابًا دون أن تغلق قلبك
وأن تبتعد دون أن تتحول إلى عدو.
فليس مطلوبًا منك أن تشرب ماء البحر كله حتى تتأكد أنه مالح.
تكفيك الرشفة الأولى لتعرف الحقيقة
وتكفيك الحكمة كي لا تكرر التجربة باسم المحبة.
اغفر لأن المسيح غفر لك.
لكن تعلّم
لأن الله أعطاك عقلًا.
ضع حدودًا
لأن جسدك ونفسك وحياتك أمانة.
وامضِ إلى الأمام
لأن الله لا يدعوك إلى أن تقضي بقية عمرك واقفًا أمام بابٍ يؤذيك
بينما أمامك أبواب أخرى فتحها لك بنعمته.
الغفران يحرر قلبك من المسيء
والتمييز يحمي حياتك من تكرار الإساءة
والنعمة تمنحك القوة لتفعل الاثنين دون مرارة.
القس راضي عطالله`
  },
  {
    title: 'How Do We Measure the Spiritual Stunting of the Church?',
    titleAr: 'ما هو المقياس الدقيق الرقمي لتقزّم شعب الكنيسة روحيًا؟',
    image: img('1438232992991-995b7058bbb3'),
    tags: ['spiritual growth', 'discipleship', 'church health', 'maturity'],
    tagsAr: ['النمو الروحي', 'التلمذة', 'صحة الكنيسة', 'النضج'],
    excerpt: 'A church can grow in numbers while its people shrink inside. A five-dimension index for measuring real spiritual maturity, not just attendance.',
    excerptAr: 'يمكن أن تكبر الكنيسة بالأرقام بينما يتقزّم الإنسان في الداخل. مؤشر من خمسة محاور لقياس النضج الروحي الحقيقي.',
    content: `
Dr. Adel Azab asked an important question about the precise measure for knowing the state of the church's spiritual stunting. I thank him for this question and summarize my answer as follows.
We live in a time when a church can know the number of attendees, meetings, and servants, the size of donations, and the views of its live stream, yet it may be unable to answer the most serious question: Are its people growing spiritually?
A church can grow in numbers while the person inside shrinks.
The biblical measure is not "How many people attended?" but "How many people have become more like Christ?" "Till we all come to the unity of the faith… to the measure of the stature of the fullness of Christ" (Ephesians 4:13).
So we can propose a numerical index for the church's spiritual growth, not to turn the work of the Holy Spirit into a mathematical equation, but to keep us from deceiving ourselves with easy numbers.
Spiritual maturity can be measured across five dimensions:
<strong>1. Depth in the Word – 20%.</strong> Does the believer move from hearing the sermon to studying, understanding, and applying the Bible? "Desire the pure milk of the word, that you may grow thereby" (1 Peter 2:2).
<strong>2. Depth of character – 20%.</strong> Are morals, honesty, self-control, forgiveness, and love changing? Fruit is the test: "You will know them by their fruits" (Matthew 7:16).
<strong>3. Depth of fellowship – 20%.</strong> Is the church turning from an audience into a body? Does the believer "bear one another's burdens" (Galatians 6:2)?
<strong>4. Depth of service – 20%.</strong> Does the receiver become a servant, and the servant a disciple-maker? "The things you have heard from me… commit these to faithful men" (2 Timothy 2:2).
<strong>5. Depth of mission – 20%.</strong> Has faith gone beyond the church walls into the home and society? "You shall be witnesses to Me" (Acts 1:8).
A church can measure itself periodically: 80–100 means strong signs of maturity; 60–79 means growth is present but needs deepening; 40–59 means fragile growth that needs clear pastoral intervention; below 40 is a church alarm calling for a comprehensive review of its discipleship and pastoral care system.
These scores are not a "divine verdict" and cannot measure the work of the Holy Spirit, but they may reveal what our reports try to hide.
A church may grow horizontally in number while not growing vertically in Christ.
The most dangerous church is not the small church, but the large church that produces small believers. And the most dangerous member is not the one who does not attend, but the one who has attended for twenty years and never changed.
The question that should haunt every servant is not "How many did we add this year?" but "How many people became more like Christ because of our ministry?" For Christ did not say "Go and gather crowds," but "Make disciples of all the nations" (Matthew 28:19).
We may have a church of thousands of members, yet a people of spiritual dwarfs. True success is not filling the church's seats, but filling heaven with the fruit of its discipleship.
The church may be full while Christ is absent from behavior. Programs may be many while discipleship is little. Pulpits may increase while holiness decreases, and meetings multiply while love weakens.
The most dangerous kind of spiritual stunting is when a person grows so used to a short stature that they think it is normal.
A mature church is not the one that can say, "Look how big we have become," but the one of which Christ can say, "to the measure of the stature of the fullness of Christ."
In the end, the real number is not the count of filled seats, but the count of changed lives.
Rev. Radi Atallah`,
    contentAr: `
الدكتور عادل عزب سأل سؤالا مهما عن المقياس الدقيق لمعرفة حالة التقزم الروحي للكنيسة
وانا اشكره علي هذا السؤال والخص إجابتي في الاتي:
نحن نعيش في زمن تستطيع فيه الكنيسة أن تعرف عدد الحاضرين
وعدد الاجتماعات
وعدد الخدام
وحجم التبرعات
ومشاهدات البث المباشر لكنها قد تعجز عن الإجابة عن السؤال الأخطر
هل ينمو شعبها روحيًا؟
يمكن أن تكبر الكنيسة بالأرقام
بينما يتقزّم الإنسان في الداخل.
المقياس الكتابي ليس
كم شخصًا حضر؟
بل كم شخصًا صار أكثر شبهًا بالمسيح؟
«إِلَى أَنْ نَنَالَ جَمِيعُنَا إِلَى وَحْدَانِيَّةِ الإِيمَانِ… إِلَى قِيَاسِ قَامَةِ مِلْءِ الْمَسِيحِ» (أفسس 4: 13).
ولذلك يمكن اقتراح مؤشر رقمي للنمو الروحي الكنسي لا ليحوّل عمل الروح القدس إلى معادلة رياضية
بل ليمنعنا من خداع أنفسنا بالأرقام السهلة.
يمكن قياس النضج الروحي عبر خمسة محاور:
<strong>1. عمق الكلمة – 20%</strong>
هل ينتقل المؤمن من سماع العظة إلى دراسة الكتاب وفهمه وتطبيقه؟ «اشتهوا اللبن العقلي العديم الغش لكي تنموا به» (1بطرس 2:2).
<strong>2. عمق الشخصية – 20%</strong>
هل تتغير الأخلاق والأمانة وضبط النفس والغفران والمحبة؟
فالثمر هو الاختبار: «من ثمارهم تعرفونهم» (متى 16:7).
<strong>3. عمق الشركة – 20%</strong>
هل تتحول الكنيسة من جمهور إلى جسد؟
هل يحمل المؤمن «بعضكم أثقال بعض» (غلاطية 6:2)؟
<strong>4. عمق الخدمة – 20%</strong>
هل يتحول المتلقي إلى خادم والخادم إلى صانع تلاميذ؟ «ما سمعته مني… أودعه أناسًا أمناء» (2تيموثاوس 2:2).
<strong>5. عمق الرسالة – 20%</strong>
هل خرج الإيمان من جدران الكنيسة إلى البيت والمجتمع؟ «تكونون لي شهودًا» (أعمال 8:1).
يمكن للكنيسة أن تقيس نفسها دوريًا:
80–100: مؤشرات نضج قوية.
60–79: نمو موجود لكنه يحتاج إلى تعميق.
40–59: نمو هش يحتاج إلى تدخل رعوي واضح.
أقل من 40: إنذار كنسي يستدعي مراجعة شاملة لمنظومة التلمذة والرعاية.
هذه الدرجات ليست «حكمًا إلهيًا» ولا يمكنها قياس عمل الروح القدس لكنها قد تكشف ما تحاول تقاريرنا إخفاءه.
فالكنيسة قد تنمو أفقيًا بالعدد
بينما لا تنمو رأسيًا في المسيح.
أخطر كنيسة ليست الكنيسة الصغيرة
بل الكنيسة الكبيرة التي تنتج مؤمنين صغارًا.
وأخطر عضو ليس الذي لا يحضر
بل الذي يحضر عشرين عامًا ولا يتغير.
السؤال الذي يجب أن يطارد كل خادم ليس:
كم أضفنا هذا العام؟
بل:
كم شخصًا صار أكثر شبهًا بالمسيح بسبب خدمتنا؟
لأن المسيح لم يقل
«اذهبوا واجمعوا جماهير»، بل قال
«تلمذوا جميع الأمم» (متى 19:28).
قد يكون لدينا كنيسة من آلاف الأعضاء ولكن شعب من الأقزام روحيًا.
والنجاح الحقيقي ليس أن تملأ الكنيسة مقاعدها
بل أن تملأ السماء بثمار تلمذتها.
قد تكون الكنيسة ممتلئة والمسيح غائبًا عن السلوك.
وقد تكون البرامج كثيرة والتلمذة قليلة.
وقد تزداد المنابر بينما تقل القداسة
وتكثر الاجتماعات بينما تضعف المحبة.
إن أخطر أنواع التقزّم الروحي هو أن يعتاد الإنسان القامة القصيرة حتى يظنها طبيعية.
فالكنيسة الناضجة ليست التي تستطيع أن تقول «انظروا كم كبرنا»،
بل التي يستطيع المسيح أن يقول عنها
«إلى قياس قامة ملء المسيح».
وفي النهاية
الرقم الحقيقي ليس عدد المقاعد الممتلئة
بل عدد الحياة التي تغيرت.
القس راضي عطالله`
  }
];

const ALL_PERMISSIONS = User.schema.path('permissions').caster.enumValues;

async function ensureUser(query, data) {
  const existing = await User.findOne(query);
  if (existing) return { user: existing, created: false };
  const user = new User(data);
  await user.save();
  return { user, created: true };
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'azino_publishing' });
  console.log('Connected to', mongoose.connection.db.databaseName);

  const admin = await ensureUser({ username: 'admin' }, {
    name: 'Admin',
    email: 'admin@hopeforallmena.org',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    permissions: ALL_PERMISSIONS,
    status: 'active'
  });
  console.log(admin.created ? 'Created admin user' : 'Admin user already exists (unchanged)');

  // Author-only account: inactive with a random password so it cannot be used to log in.
  const author = await ensureUser({ username: 'radi.atallah' }, {
    name: 'Rev. Radi Atallah',
    email: 'radi.atallah@hopeforallmena.org',
    username: 'radi.atallah',
    password: crypto.randomBytes(24).toString('hex'),
    role: 'author',
    permissions: [],
    status: 'inactive'
  });
  console.log(author.created ? 'Created author user' : 'Author user already exists (unchanged)');

  const DAY = 24 * 60 * 60 * 1000;
  for (const [i, p] of posts.entries()) {
    const slug = slugify(p.title);
    const data = {
      ...p,
      slug,
      content: toParagraphs(p.content),
      contentAr: toArabicParagraphs(p.contentAr),
      author: author.user._id,
      category: 'stories',
      status: 'published',
      publishedAt: new Date(Date.now() - i * DAY)
    };
    const blog = (await Blog.findOne({ slug })) || new Blog();
    blog.set(data);
    await blog.save();
    console.log(`Saved: ${blog.slug}`);
  }

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
