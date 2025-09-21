const Book = require('../models/Book');
const Author = require('../models/Author');
const Category = require('../models/Category');

class BookController {
  // Get all books with pagination and filtering
  async getBooks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        category,
        author,
        minRating,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Build query
      const query = {};
      
      if (search) {
        query.$text = { $search: search };
      }
      
      if (status) query.status = status;
      if (category) query.category = category;
      if (author) query.author = author;
      
      if (minRating !== undefined) {
        query.averageRating = { $gte: parseFloat(minRating) };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get books with pagination
      const [books, total] = await Promise.all([
        Book.find(query)
          .populate({
            path: 'author',
            select: 'name nameAr avatarUrl biography biographyAr'
          })
          .populate('category', 'name_en name_ar slug color')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Book.countDocuments(query)
      ]);

      // Debug: Log the first book's author to check if nameAr is populated
      if (books.length > 0 && books[0].author) {
        console.log('=== SERVER DEBUG: First Book Author ===');
        console.log('Author Object:', books[0].author);
        console.log('Author nameAr:', books[0].author.nameAr);
        console.log('Author Keys:', Object.keys(books[0].author.toObject ? books[0].author.toObject() : books[0].author));
      }

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          books,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalBooks: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get books error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve books'
      });
    }
  }

  // Get book statistics
  async getBookStats(req, res) {
    try {
      const stats = await Book.getStats();
      
      // Get recent books (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentBooks = await Book.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get top books by sales
      const topSellingBooks = await Book.find({ status: 'published' })
        .populate('author', 'name nameAr')
        .populate('category', 'name_en name_ar')
        .sort({ totalSales: -1 })
        .limit(5)
        .select('title author category totalSales averageRating');

      // Get top books by rating
      const topRatedBooks = await Book.find({ 
        status: 'published',
        averageRating: { $gte: 4.0 }
      })
        .populate('author', 'name nameAr')
        .populate('category', 'name_en name_ar')
        .sort({ averageRating: -1 })
        .limit(5)
        .select('title author category averageRating totalReviews');

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentBooks,
          topSellingBooks,
          topRatedBooks
        }
      });

    } catch (error) {
      console.error('Get book stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve book statistics'
      });
    }
  }

  // Get book by ID
  async getBookById(req, res) {
    try {
      const book = await Book.findById(req.params.id)
        .populate('author', 'name nameAr biography biographyAr avatarUrl website socialMedia')
        .populate('category', 'name_en name_ar slug description_en description_ar color');
      
      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Increment views
      await book.incrementViews();

      res.status(200).json({
        status: 'success',
        data: {
          book
        }
      });

    } catch (error) {
      console.error('Get book error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve book'
      });
    }
  }

  // Create new book
  async createBook(req, res) {
    try {
      const { 
        title, 
        author, 
        category, 
        description, 
        shortDescription, 
        coverImageUrl,
        pages,
        language = 'English',
        publicationYear,
        status = 'not-published',
        tags = [],
        weight,
        dimensions,
        format = 'paperback',
        ageGroup = 'adult',
        metaTitle,
        metaDescription,
        titleAr,
        descriptionAr,
        shortDescriptionAr,
        metaTitleAr,
        metaDescriptionAr
      } = req.body;

      // Validate author exists
      const authorExists = await Author.findById(author);
      if (!authorExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      // Validate category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Check if book with same title and author already exists
      const existingBook = await Book.findOne({
        title: { $regex: new RegExp(`^${title}$`, 'i') },
        author: author
      });

      if (existingBook) {
        return res.status(400).json({
          status: 'error',
          message: 'A book with this title by this author already exists. Please choose a different title or author.',
          field: 'title',
          suggestion: 'Try adding a subtitle or publication year to make it unique'
        });
      }

      // Create new book
      const book = new Book({
        title,
        author,
        category,
        description,
        shortDescription,
        coverImageUrl,
        pages,
        language,
        publicationYear,
        status,
        tags,
        weight,
        dimensions,
        format,
        ageGroup,
        metaTitle,
        metaDescription,
        titleAr,
        descriptionAr,
        shortDescriptionAr,
        metaTitleAr,
        metaDescriptionAr
      });

      await book.save();

      // Populate the book with author and category data
      await book.populate('author', 'name nameAr avatarUrl');
      await book.populate('category', 'name_en name_ar slug color');

      // Update author's books count
      await authorExists.updateBooksCount();

      // Update category's books count
      await categoryExists.updateBooksCount();

      res.status(201).json({
        status: 'success',
        message: 'Book created successfully',
        data: {
          book
        }
      });

    } catch (error) {
      console.error('Create book error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field}.`,
          field: field,
          suggestion: 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create book'
      });
    }
  }

  // Update book
  async updateBook(req, res) {
    try {
      const { 
        title, 
        author, 
        category, 
        description, 
        shortDescription, 
        coverImageUrl,
        pages,
        language,
        publicationYear,
        status, 
        tags,
        weight,
        dimensions,
        format,
        ageGroup,
        metaTitle,
        metaDescription,
        titleAr,
        descriptionAr,
        shortDescriptionAr,
        metaTitleAr,
        metaDescriptionAr
      } = req.body;
      const bookId = req.params.id;

      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Validate author exists if provided
      if (author) {
        const authorExists = await Author.findById(author);
        if (!authorExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Author not found'
          });
        }
      }

      // Validate category exists if provided
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Category not found'
          });
        }
      }

      // Check if title and author combination is already taken by another book
      if (title || author) {
        const query = {
          _id: { $ne: bookId },
          $and: []
        };

        if (title) query.$and.push({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
        if (author) query.$and.push({ author: author });

        if (query.$and.length > 0) {
          const existingBook = await Book.findOne(query);
          if (existingBook) {
            return res.status(400).json({
              status: 'error',
              message: 'A book with this title by this author already exists. Please choose a different title or author.',
              field: 'title',
              suggestion: 'Try adding a subtitle or publication year to make it unique'
            });
          }
        }
      }

      // Prepare update data
      const updateData = {};
      if (title) updateData.title = title;
      if (author) updateData.author = author;
      if (category) updateData.category = category;
      if (description) updateData.description = description;
      if (shortDescription) updateData.shortDescription = shortDescription;
      if (coverImageUrl) updateData.coverImageUrl = coverImageUrl;
      if (pages !== undefined) updateData.pages = pages;
      if (language) updateData.language = language;
      if (publicationYear !== undefined) updateData.publicationYear = publicationYear;
      if (status) updateData.status = status;
      if (tags !== undefined) updateData.tags = tags;
      if (weight !== undefined) updateData.weight = weight;
      if (dimensions !== undefined) updateData.dimensions = dimensions;
      if (format) updateData.format = format;
      if (ageGroup) updateData.ageGroup = ageGroup;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
      if (titleAr !== undefined) updateData.titleAr = titleAr;
      if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
      if (shortDescriptionAr !== undefined) updateData.shortDescriptionAr = shortDescriptionAr;
      if (metaTitleAr !== undefined) updateData.metaTitleAr = metaTitleAr;
      if (metaDescriptionAr !== undefined) updateData.metaDescriptionAr = metaDescriptionAr;

      // Update book
      const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        updateData,
        { new: true, runValidators: true }
      ).populate('author', 'name nameAr avatarUrl').populate('category', 'name_en name_ar slug color');

      // Update author and category stats if changed
      if (author && author !== book.author.toString()) {
        const oldAuthor = await Author.findById(book.author);
        const newAuthor = await Author.findById(author);
        if (oldAuthor) await oldAuthor.updateBooksCount();
        if (newAuthor) await newAuthor.updateBooksCount();
      }

      if (category && category !== book.category.toString()) {
        const oldCategory = await Category.findById(book.category);
        const newCategory = await Category.findById(category);
        if (oldCategory) await oldCategory.updateBooksCount();
        if (newCategory) await newCategory.updateBooksCount();
      }

      res.status(200).json({
        status: 'success',
        message: 'Book updated successfully',
        data: {
          book: updatedBook
        }
      });

    } catch (error) {
      console.error('Update book error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field}.`,
          field: field,
          suggestion: 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update book'
      });
    }
  }

  // Delete book
  async deleteBook(req, res) {
    try {
      const bookId = req.params.id;

      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Delete book
      await Book.findByIdAndDelete(bookId);

      // Update author and category stats
      const author = await Author.findById(book.author);
      const category = await Category.findById(book.category);
      
      if (author) await author.updateBooksCount();
      if (category) await category.updateBooksCount();

      res.status(200).json({
        status: 'success',
        message: 'Book deleted successfully'
      });

    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete book'
      });
    }
  }

  // Update book status
  async updateBookStatus(req, res) {
    try {
      const { status } = req.body;
      const bookId = req.params.id;

      if (!status || !['published', 'not-published'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (published or not-published)'
        });
      }

      const book = await Book.findByIdAndUpdate(
        bookId,
        { status },
        { new: true, runValidators: true }
      ).populate('author', 'name nameAr avatarUrl').populate('category', 'name_en name_ar slug color');

      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Update author and category stats
      const author = await Author.findById(book.author._id);
      const category = await Category.findById(book.category._id);
      
      if (author) await author.updateBooksCount();
      if (category) await category.updateBooksCount();

      res.status(200).json({
        status: 'success',
        message: `Book ${status === 'published' ? 'published' : 'moved to not-published'} successfully`,
        data: {
          book
        }
      });

    } catch (error) {
      console.error('Update book status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update book status'
      });
    }
  }

  // Get recent books
  async getRecentBooks(req, res) {
    try {
      const { limit = 10 } = req.query;

      const books = await Book.find({ status: 'published' })
        .populate('author', 'name nameAr avatarUrl')
        .populate('category', 'name_en name_ar slug color')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: {
          books
        }
      });

    } catch (error) {
      console.error('Get recent books error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve recent books'
      });
    }
  }

  // Update book's average rating
  async updateBookRating(req, res) {
    try {
      const bookId = req.params.id;

      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Update average rating
      await book.updateAverageRating();

      // Refresh book data
      const updatedBook = await Book.findById(bookId)
        .populate('author', 'name nameAr avatarUrl')
        .populate('category', 'name_en name_ar slug color');

      res.status(200).json({
        status: 'success',
        message: 'Book rating updated successfully',
        data: {
          book: updatedBook
        }
      });

    } catch (error) {
      console.error('Update book rating error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update book rating'
      });
    }
  }
}

module.exports = new BookController();
