const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogStats,
  getFeaturedBlogs,
  getRecentBlogs,
  getAdjacentBlogs
} = require('../controllers/blogController');

const {
  getBlogComments,
  createComment,
  getAllComments,
  updateCommentStatus,
  deleteComment,
  getCommentStats,
  bulkUpdateComments,
  getCommentReplies
} = require('../controllers/commentController');

const router = express.Router();

// Configure multer for memory storage (Vercel compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Admin blog routes (must come before parameterized routes)
router.get('/admin/all', authenticate, authorize(['blogs', 'user-management']), getAllBlogs);
router.post('/admin', authenticate, authorize(['blogs', 'user-management']), upload.single('image'), createBlog);
router.put('/admin/:id', authenticate, authorize(['blogs', 'user-management']), upload.single('image'), updateBlog);
router.delete('/admin/:id', authenticate, authorize(['blogs', 'user-management']), deleteBlog);
router.get('/admin/stats', authenticate, authorize(['blogs', 'user-management']), getBlogStats);

// Admin comment routes (must come before parameterized routes)
router.get('/admin/comments', authenticate, authorize(['blogs', 'user-management']), getAllComments);
router.put('/admin/comments/:id/status', authenticate, authorize(['blogs', 'user-management']), updateCommentStatus);
router.delete('/admin/comments/:id', authenticate, authorize(['blogs', 'user-management']), deleteComment);
router.get('/admin/comments/stats', authenticate, authorize(['blogs', 'user-management']), getCommentStats);
router.put('/admin/comments/bulk-update', authenticate, authorize(['blogs', 'user-management']), bulkUpdateComments);

// Public blog routes
router.get('/', getPublishedBlogs); // Root route returns published blogs
router.get('/published', getPublishedBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/recent', getRecentBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/adjacent/:slug', getAdjacentBlogs);

// Public comment routes (must come after admin routes)
router.get('/:blogId/comments', getBlogComments);
router.post('/:blogId/comments', createComment);
router.get('/comments/:commentId/replies', getCommentReplies);

module.exports = router;
