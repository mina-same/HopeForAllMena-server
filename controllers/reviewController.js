const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');

class ReviewController {
  // Get all reviews with pagination and filtering
  async getReviews(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        rating,
        book,
        user,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) query.status = status;
      if (rating) query.rating = parseInt(rating);
      if (book) query.book = book;
      if (user) query.user = user;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get reviews with pagination
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate('book', 'title coverImageUrl author')
          .populate('book.author', 'name')
          .populate('user', 'name username avatar')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Review.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve reviews'
      });
    }
  }

  // Get review statistics
  async getReviewStats(req, res) {
    try {
      const stats = await Review.getStats();
      
      // Get recent reviews (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentReviews = await Review.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get reviews by rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get top reviewed books
      const topReviewedBooks = await Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$book',
            reviewCount: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        },
        { $sort: { reviewCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        {
          $lookup: {
            from: 'authors',
            localField: 'book.author',
            foreignField: '_id',
            as: 'author'
          }
        },
        { $unwind: '$author' },
        {
          $project: {
            'book.title': 1,
            'book.coverImageUrl': 1,
            'author.name': 1,
            reviewCount: 1,
            averageRating: { $round: ['$averageRating', 1] }
          }
        }
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentReviews,
          ratingDistribution,
          topReviewedBooks
        }
      });

    } catch (error) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve review statistics'
      });
    }
  }

  // Get review by ID
  async getReviewById(req, res) {
    try {
      const review = await Review.findById(req.params.id)
        .populate('book', 'title coverImageUrl author')
        .populate('book.author', 'name')
        .populate('user', 'name username avatar email')
        .populate('moderatedBy', 'name username');
      
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          review
        }
      });

    } catch (error) {
      console.error('Get review error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve review'
      });
    }
  }

  // Create new review
  async createReview(req, res) {
    try {
      const { 
        book, 
        rating, 
        title, 
        content, 
        verifiedPurchase = false 
      } = req.body;

      const userId = req.user._id;

      // Validate book exists
      const bookExists = await Book.findById(book);
      if (!bookExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      // Check if user already reviewed this book
      const existingReview = await Review.findOne({
        book: book,
        user: userId
      });

      if (existingReview) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already reviewed this book. You can only submit one review per book.',
          field: 'book',
          suggestion: 'You can edit your existing review instead'
        });
      }

      // Create new review
      const review = new Review({
        book,
        user: userId,
        rating: parseInt(rating),
        title,
        content,
        verifiedPurchase,
        status: 'pending' // Reviews need moderation by default
      });

      await review.save();

      // Populate the review with book and user data
      await review.populate('book', 'title coverImageUrl author');
      await review.populate('book.author', 'name');
      await review.populate('user', 'name username avatar');

      res.status(201).json({
        status: 'success',
        message: 'Review submitted successfully and is pending approval',
        data: {
          review
        }
      });

    } catch (error) {
      console.error('Create review error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already reviewed this book. You can only submit one review per book.',
          field: 'book',
          suggestion: 'You can edit your existing review instead'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create review'
      });
    }
  }

  // Update review
  async updateReview(req, res) {
    try {
      const { 
        rating, 
        title, 
        content, 
        verifiedPurchase 
      } = req.body;
      const reviewId = req.params.id;
      const userId = req.user._id;

      // Check if review exists
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      // Check if user owns this review or is admin
      const isOwner = review.user.toString() === userId.toString();
      const isAdmin = req.user.role?.toLowerCase().includes('admin') || 
                     req.user.permissions?.includes('reviews');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only edit your own reviews'
        });
      }

      // Prepare update data
      const updateData = {};
      if (rating !== undefined) updateData.rating = parseInt(rating);
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (verifiedPurchase !== undefined) updateData.verifiedPurchase = verifiedPurchase;

      // If user is editing their own review, reset status to pending for re-moderation
      if (isOwner && !isAdmin) {
        updateData.status = 'pending';
        updateData.moderatedBy = null;
        updateData.moderatedAt = null;
        updateData.moderatorNotes = '';
      }

      // Update review
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true, runValidators: true }
      ).populate('book', 'title coverImageUrl author')
       .populate('book.author', 'name')
       .populate('user', 'name username avatar');

      res.status(200).json({
        status: 'success',
        message: isOwner && !isAdmin ? 
          'Review updated successfully and is pending re-approval' : 
          'Review updated successfully',
        data: {
          review: updatedReview
        }
      });

    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update review'
      });
    }
  }

  // Delete review
  async deleteReview(req, res) {
    try {
      const reviewId = req.params.id;
      const userId = req.user._id;

      // Check if review exists
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      // Check if user owns this review or is admin
      const isOwner = review.user.toString() === userId.toString();
      const isAdmin = req.user.role?.toLowerCase().includes('admin') || 
                     req.user.permissions?.includes('reviews');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only delete your own reviews'
        });
      }

      // Delete review
      await Review.findByIdAndDelete(reviewId);

      res.status(200).json({
        status: 'success',
        message: 'Review deleted successfully'
      });

    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete review'
      });
    }
  }

  // Moderate review (approve/reject)
  async moderateReview(req, res) {
    try {
      const { status, notes = '' } = req.body;
      const reviewId = req.params.id;
      const moderatorId = req.user._id;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (approved or rejected)'
        });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      // Moderate the review
      await review.moderate(status, moderatorId, notes);

      // Populate the review with updated data
      await review.populate('book', 'title coverImageUrl author');
      await review.populate('book.author', 'name');
      await review.populate('user', 'name username avatar');
      await review.populate('moderatedBy', 'name username');

      res.status(200).json({
        status: 'success',
        message: `Review ${status} successfully`,
        data: {
          review
        }
      });

    } catch (error) {
      console.error('Moderate review error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to moderate review'
      });
    }
  }

  // Get pending reviews
  async getPendingReviews(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const reviews = await Review.getPendingReviews({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = await Review.countDocuments({ status: 'pending' });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get pending reviews error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve pending reviews'
      });
    }
  }

  // Get reviews by book
  async getReviewsByBook(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        rating, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;
      const bookId = req.params.bookId;

      // Validate book exists
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({
          status: 'error',
          message: 'Book not found'
        });
      }

      const reviews = await Review.getReviewsByBook(bookId, {
        page: parseInt(page),
        limit: parseInt(limit),
        rating: rating ? parseInt(rating) : undefined,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 1 : -1
      });

      const total = await Review.countDocuments({ 
        book: bookId, 
        status: 'approved',
        ...(rating ? { rating: parseInt(rating) } : {})
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get reviews by book error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve reviews for this book'
      });
    }
  }

  // Get reviews by user
  async getReviewsByUser(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;
      const userId = req.params.userId;

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const reviews = await Review.getReviewsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 1 : -1
      });

      const total = await Review.countDocuments({ 
        user: userId,
        ...(status ? { status } : {})
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalReviews: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get reviews by user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve reviews for this user'
      });
    }
  }

  // Mark review as helpful
  async markHelpful(req, res) {
    try {
      const reviewId = req.params.id;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      await review.markHelpful();

      res.status(200).json({
        status: 'success',
        message: 'Review marked as helpful',
        data: {
          helpful: review.helpful,
          notHelpful: review.notHelpful,
          helpfulPercentage: review.helpfulPercentage
        }
      });

    } catch (error) {
      console.error('Mark helpful error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark review as helpful'
      });
    }
  }

  // Mark review as not helpful
  async markNotHelpful(req, res) {
    try {
      const reviewId = req.params.id;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          status: 'error',
          message: 'Review not found'
        });
      }

      await review.markNotHelpful();

      res.status(200).json({
        status: 'success',
        message: 'Review marked as not helpful',
        data: {
          helpful: review.helpful,
          notHelpful: review.notHelpful,
          helpfulPercentage: review.helpfulPercentage
        }
      });

    } catch (error) {
      console.error('Mark not helpful error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark review as not helpful'
      });
    }
  }
}

module.exports = new ReviewController();
