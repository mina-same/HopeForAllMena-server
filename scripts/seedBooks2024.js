require('dotenv').config();
const mongoose = require('mongoose');
const Author = require('../models/Author');
const Category = require('../models/Category');
const Book = require('../models/Book');

const data = require('../../client/src/assets/images/2024/books2024-with-cloudinary.json');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'azino_publishing';

const trunc = (str, max) => {
  if (!str || typeof str !== 'string') return str;
  return str.length > max ? str.substring(0, max - 3) + '...' : str;
};

async function seedBooks() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log(`✅ Connected to: ${mongoose.connection.db.databaseName}\n`);

    // 1. Clear existing data
    console.log('🗑️  Clearing existing books, authors, categories...');
    await Book.deleteMany({});
    await Author.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Cleared\n');

    // 2. Seed categories
    console.log('📁 Seeding categories...');
    const categoryMap = {};
    for (const cat of data.categories) {
      const saved = await Category.create({
        name_en: cat.name_en,
        name_ar: cat.name_ar,
        description_en: cat.description_en,
        description_ar: cat.description_ar,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        parentCategory: cat.parentCategory,
        isSubcategory: cat.isSubcategory,
        status: cat.status
      });
      categoryMap[cat.slug] = saved._id;
      console.log(`  ✅ ${cat.name_en}`);
    }
    console.log();

    // 3. Seed authors (deduplicate by name)
    console.log('👤 Seeding authors...');
    const authorMap = {};
    for (const auth of data.authors) {
      if (authorMap[auth.name]) continue;
      const saved = await Author.create({
        name: auth.name,
        nameAr: auth.nameAr,
        biography: trunc(auth.biography, 2000),
        biographyAr: trunc(auth.biographyAr, 2000)
      });
      authorMap[auth.name] = saved._id;
      console.log(`  ✅ ${auth.name}`);
    }
    console.log();

    // 4. Seed books
    console.log('📚 Seeding books...');
    let created = 0, skipped = 0;
    for (const book of data.books) {
      const PLACEHOLDER = '000000000000000000000000';
      if (book.author === PLACEHOLDER || book.category === PLACEHOLDER) {
        console.log(`  ⚠️  Skipping "${book.title}" (missing author/category ID)`);
        skipped++;
        continue;
      }

      const authorId = authorMap[book.author];
      const categoryId = categoryMap[book.category];

      if (!authorId) {
        console.log(`  ⚠️  Skipping "${book.title}" (author not found: "${book.author}")`);
        skipped++;
        continue;
      }
      if (!categoryId) {
        console.log(`  ⚠️  Skipping "${book.title}" (category not found: "${book.category}")`);
        skipped++;
        continue;
      }

      const rawPages = book.pages;
      const pages = (rawPages && rawPages !== 'null' && rawPages !== 'unknown')
        ? parseInt(rawPages) : undefined;

      const bookData = {
        title: trunc(book.title, 200),
        titleAr: trunc(book.titleAr, 200),
        author: authorId,
        category: categoryId,
        description: trunc(book.description, 2000),
        descriptionAr: trunc(book.descriptionAr, 2000),
        shortDescription: trunc(book.shortDescription, 300),
        shortDescriptionAr: trunc(book.shortDescriptionAr, 300),
        coverImageUrl: book.coverImageUrl,
        language: 'none',
        publicationYear: book.publicationYear,
        status: book.status,
        tags: book.tags,
        averageRating: book.averageRating,
        totalReviews: book.totalReviews,
        totalSales: book.totalSales,
        totalViews: book.totalViews,
        format: book.format,
        ageGroup: book.ageGroup,
        weight: book.weight,
        dimensions: book.dimensions,
        metaTitle: trunc(book.metaTitle, 60),
        metaTitleAr: trunc(book.metaTitleAr, 60),
        metaDescription: trunc(book.metaDescription, 160),
        metaDescriptionAr: trunc(book.metaDescriptionAr, 160)
      };
      if (pages && pages >= 1) bookData.pages = pages;

      try {
        await Book.create(bookData);
        created++;
        console.log(`  ✅ ${book.title}`);
      } catch (err) {
        console.error(`  ❌ Failed "${book.title}": ${err.message}`);
        if (err.errors) {
          for (const [k, v] of Object.entries(err.errors)) {
            console.error(`       ${k}: ${v.message}`);
          }
        }
        skipped++;
      }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   Books created : ${created}`);
    console.log(`   Books skipped : ${skipped}`);
    console.log(`   Authors       : ${Object.keys(authorMap).length}`);
    console.log(`   Categories    : ${Object.keys(categoryMap).length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      for (const [k, v] of Object.entries(error.errors)) {
        console.error(`  - ${k}: ${v.message}`);
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

seedBooks();
