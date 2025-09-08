const Author = require('../models/Author');
const Book = require('../models/Book');

class AuthorController {
  // Get all authors with pagination and filtering
  async getAuthors(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        featured = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nameAr: { $regex: search, $options: 'i' } },
          { biography: { $regex: search, $options: 'i' } },
          { biographyAr: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by status
      if (status && status !== 'all') {
        query.status = status;
      }

      // Filter by featured
      if (featured && featured !== 'all') {
        query.featured = featured === 'true';
      }
      

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get authors with pagination
      const [authors, total] = await Promise.all([
        Author.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Author.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          authors,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalAuthors: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get authors error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve authors'
      });
    }
  }

  // Get author statistics
  async getAuthorStats(req, res) {
    try {
      const stats = await Author.getStats();
      
      // Get recent authors (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAuthors = await Author.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get top authors by books count
      const topAuthors = await Author.find({})
        .sort({ booksCount: -1 })
        .limit(5)
        .select('name booksCount averageRating');

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentAuthors,
          topAuthors
        }
      });

    } catch (error) {
      console.error('Get author stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve author statistics'
      });
    }
  }

  // Get author by ID
  async getAuthorById(req, res) {
    try {
      const author = await Author.findById(req.params.id);
      
      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      // Get author's books
      const books = await Book.find({ author: author._id, status: 'published' })
        .populate('category', 'name slug color')
        .select('title coverImageUrl category averageRating totalReviews publicationDate')
        .sort({ publicationDate: -1 });

      res.status(200).json({
        status: 'success',
        data: {
          author,
          books
        }
      });

    } catch (error) {
      console.error('Get author error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve author'
      });
    }
  }

  // Create new author
  async createAuthor(req, res) {
    try {
      const { 
        name, 
        nameAr,
        biography, 
        biographyAr,
        avatarUrl
      } = req.body;

      // Check if author already exists
      const existingAuthor = await Author.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${name}$`, 'i') } },
          { nameAr: { $regex: new RegExp(`^${nameAr}$`, 'i') } }
        ]
      });

      if (existingAuthor) {
        const field = existingAuthor.name?.toLowerCase() === name.toLowerCase() ? 'name' : 'nameAr';
        const fieldName = field === 'name' ? 'English name' : 'Arabic name';
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${fieldName.toLowerCase()}.`,
          field: field,
          suggestion: 'Try adding a middle name or initial'
        });
      }

      // Create new author
      const author = new Author({
        name,
        nameAr,
        biography,
        biographyAr,
        avatarUrl
      });

      await author.save();

      res.status(201).json({
        status: 'success',
        message: 'Author created successfully',
        data: {
          author
        }
      });

    } catch (error) {
      console.error('Create author error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'name' ? 'English name' : field === 'nameAr' ? 'Arabic name' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${fieldName.toLowerCase()}.`,
          field: field,
          suggestion: 'Try adding a middle name or initial'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create author'
      });
    }
  }

  // Update author
  async updateAuthor(req, res) {
    try {
      const { 
        name, 
        nameAr,
        biography, 
        biographyAr,
        avatarUrl
      } = req.body;
      const authorId = req.params.id;

      // Check if author exists
      const author = await Author.findById(authorId);
      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      // Check if name is already taken by another author
      if (name || nameAr) {
        const query = {
          _id: { $ne: authorId },
          $or: []
        };

        if (name) query.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (nameAr) query.$or.push({ nameAr: { $regex: new RegExp(`^${nameAr}$`, 'i') } });

        if (query.$or.length > 0) {
          const existingAuthor = await Author.findOne(query);
          if (existingAuthor) {
            const field = existingAuthor.name?.toLowerCase() === name?.toLowerCase() ? 'name' : 'nameAr';
            const fieldName = field === 'name' ? 'English name' : 'Arabic name';
            return res.status(400).json({
              status: 'error',
              message: `${fieldName} is already taken by another author. Please choose a different ${fieldName.toLowerCase()}.`,
              field: field,
              suggestion: 'Try adding a middle name or initial'
            });
          }
        }
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (nameAr) updateData.nameAr = nameAr;
      if (biography) updateData.biography = biography;
      if (biographyAr) updateData.biographyAr = biographyAr;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      // Update author
      const updatedAuthor = await Author.findByIdAndUpdate(
        authorId,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        status: 'success',
        message: 'Author updated successfully',
        data: {
          author: updatedAuthor
        }
      });

    } catch (error) {
      console.error('Update author error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'name' ? 'English name' : field === 'nameAr' ? 'Arabic name' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${fieldName.toLowerCase()}.`,
          field: field,
          suggestion: 'Try adding a middle name or initial'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update author'
      });
    }
  }

  // Delete author
  async deleteAuthor(req, res) {
    try {
      const authorId = req.params.id;

      // Check if author exists
      const author = await Author.findById(authorId);
      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      // Check if author has books
      const booksCount = await Book.countDocuments({ author: authorId });
      if (booksCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete author. This author has ${booksCount} book${booksCount !== 1 ? 's' : ''} associated with them. Please reassign or delete the books first.`,
          booksCount
        });
      }

      // Delete author
      await Author.findByIdAndDelete(authorId);

      res.status(200).json({
        status: 'success',
        message: 'Author deleted successfully'
      });

    } catch (error) {
      console.error('Delete author error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete author'
      });
    }
  }

  // Update author status
  async updateAuthorStatus(req, res) {
    try {
      const { status } = req.body;
      const authorId = req.params.id;

      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (active or inactive)'
        });
      }

      const author = await Author.findByIdAndUpdate(
        authorId,
        { status },
        { new: true, runValidators: true }
      );

      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Author ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: {
          author
        }
      });

    } catch (error) {
      console.error('Update author status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update author status'
      });
    }
  }

  // Toggle author featured status
  async toggleAuthorFeatured(req, res) {
    try {
      const authorId = req.params.id;

      const author = await Author.findById(authorId);
      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      author.featured = !author.featured;
      await author.save();

      res.status(200).json({
        status: 'success',
        message: `Author ${author.featured ? 'featured' : 'unfeatured'} successfully`,
        data: {
          author
        }
      });

    } catch (error) {
      console.error('Toggle author featured error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to toggle author featured status'
      });
    }
  }

  // Get featured authors
  async getFeaturedAuthors(req, res) {
    try {
      const { limit = 10 } = req.query;

      const authors = await Author.find({})
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: {
          authors
        }
      });

    } catch (error) {
      console.error('Get featured authors error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve featured authors'
      });
    }
  }

  // Update author's books count and average rating
  async updateAuthorStats(req, res) {
    try {
      const authorId = req.params.id;

      const author = await Author.findById(authorId);
      if (!author) {
        return res.status(404).json({
          status: 'error',
          message: 'Author not found'
        });
      }

      // Update books count
      await author.updateBooksCount();
      
      // Update average rating
      await author.updateAverageRating();

      // Refresh author data
      const updatedAuthor = await Author.findById(authorId);

      res.status(200).json({
        status: 'success',
        message: 'Author statistics updated successfully',
        data: {
          author: updatedAuthor
        }
      });

    } catch (error) {
      console.error('Update author stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update author statistics'
      });
    }
  }
}

module.exports = new AuthorController();
