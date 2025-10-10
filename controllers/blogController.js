const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');

// Get all published blogs (public)
const getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, search } = req.query;
    const query = { status: 'published' };

    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAr: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { excerptAr: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { tagsAr: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single blog by slug (public)
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('author', 'name email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all blogs (admin only)
const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAr: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { excerptAr: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new blog (admin only)
const createBlog = async (req, res) => {
  try {
    const { title, titleAr, content, contentAr, excerpt, excerptAr, category, tags, tagsAr, status, featured } = req.body;
    
    let imageUrl = '';
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'blogs',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const blog = new Blog({
      title,
      titleAr,
      content,
      contentAr,
      excerpt,
      excerptAr,
      image: imageUrl,
      author: req.user.id,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      tagsAr: tagsAr ? tagsAr.split(',').map(tag => tag.trim()) : [],
      status: status || 'draft',
      featured: featured || false
    });

    await blog.save();
    await blog.populate('author', 'name email');

    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update blog (admin only)
const updateBlog = async (req, res) => {
  try {
    const { title, titleAr, content, contentAr, excerpt, excerptAr, category, tags, tagsAr, status, featured } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    let imageUrl = blog.image;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'blogs',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    blog.title = title || blog.title;
    blog.titleAr = titleAr || blog.titleAr;
    blog.content = content || blog.content;
    blog.contentAr = contentAr || blog.contentAr;
    blog.excerpt = excerpt || blog.excerpt;
    blog.excerptAr = excerptAr || blog.excerptAr;
    blog.image = imageUrl;
    blog.category = category || blog.category;
    blog.tags = tags ? tags.split(',').map(tag => tag.trim()) : blog.tags;
    blog.tagsAr = tagsAr ? tagsAr.split(',').map(tag => tag.trim()) : blog.tagsAr;
    blog.status = status || blog.status;
    blog.featured = featured !== undefined ? featured : blog.featured;

    await blog.save();
    await blog.populate('author', 'name email');

    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete blog (admin only)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Delete associated comments
    await Comment.deleteMany({ blog: blog._id });

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get blog statistics (admin only)
const getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    const draftBlogs = await Blog.countDocuments({ status: 'draft' });
    const totalViews = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalComments = await Comment.countDocuments({ status: 'approved' });

    const categoryStats = await Blog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews: totalViews[0]?.totalViews || 0,
      totalComments,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get featured blogs (public)
const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      status: 'published', 
      featured: true 
    })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(3);

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent blogs (public)
const getRecentBlogs = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit));

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get adjacent blogs (previous/next) for navigation (public)
const getAdjacentBlogs = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // First, get the current blog to find its publishedAt date
    const currentBlog = await Blog.findOne({ 
      slug, 
      status: 'published' 
    }).select('publishedAt');
    
    if (!currentBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Get previous blog (older)
    const previousBlog = await Blog.findOne({
      status: 'published',
      publishedAt: { $lt: currentBlog.publishedAt }
    })
    .select('title slug')
    .sort({ publishedAt: -1 });

    // Get next blog (newer)
    const nextBlog = await Blog.findOne({
      status: 'published',
      publishedAt: { $gt: currentBlog.publishedAt }
    })
    .select('title slug')
    .sort({ publishedAt: 1 });

    res.json({
      previous: previousBlog,
      next: nextBlog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
