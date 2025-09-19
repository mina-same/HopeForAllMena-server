const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// Get comments for a blog (public)
const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({ 
      blog: blogId, 
      status: 'approved',
      parentComment: null 
    })
    .populate('replies')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ 
      blog: blogId, 
      status: 'approved',
      parentComment: null 
    });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new comment (public)
const createComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, email, website, content, parentComment } = req.body;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = new Comment({
      blog: blogId,
      author: { name, email, website },
      content,
      parentComment: parentComment || null,
      isReply: !!parentComment
    });

    await comment.save();

    // If it's a reply, add to parent's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(
        parentComment,
        { $push: { replies: comment._id } }
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all comments (admin only)
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, blogId, search } = req.query;
    
    console.log('getAllComments - Received params:', { page, limit, status, blogId, search });
    
    const query = {};

    if (status && status !== '') {
      query.status = status;
    }
    
    // Only add blog filter if blogId is provided, not empty, and is a valid ObjectId
    if (blogId && 
        blogId !== '' && 
        blogId !== 'admin' && 
        blogId !== 'undefined' && 
        blogId !== 'null' && 
        typeof blogId === 'string' && 
        blogId.length === 24 && 
        /^[0-9a-fA-F]{24}$/.test(blogId) &&
        mongoose.Types.ObjectId.isValid(blogId)) {
      query.blog = blogId;
      console.log('Adding blog filter for blogId:', blogId);
    } else if (blogId) {
      console.log('Skipping invalid blogId:', blogId, 'Type:', typeof blogId, 'Length:', blogId.length);
    }
    
    // Add search functionality
    if (search && search.trim() !== '') {
      query.$or = [
        { 'author.name': { $regex: search.trim(), $options: 'i' } },
        { 'author.email': { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    console.log('Final query:', JSON.stringify(query, null, 2));

    const comments = await Comment.find(query)
      .populate('blog', 'title slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments(query);

    console.log(`Found ${comments.length} comments out of ${total} total`);

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error in getAllComments:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Update comment status (admin only)
const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.status = status;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete comment (admin only)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Delete all replies if it's a parent comment
    if (!comment.isReply) {
      await Comment.deleteMany({ parentComment: comment._id });
    } else {
      // Remove from parent's replies array
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: comment._id } }
      );
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get comment statistics (admin only)
const getCommentStats = async (req, res) => {
  try {
    const totalComments = await Comment.countDocuments();
    const approvedComments = await Comment.countDocuments({ status: 'approved' });
    const pendingComments = await Comment.countDocuments({ status: 'pending' });
    const rejectedComments = await Comment.countDocuments({ status: 'rejected' });

    const recentComments = await Comment.find()
      .populate('blog', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalComments,
      approvedComments,
      pendingComments,
      rejectedComments,
      recentComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update comment status (admin only)
const bulkUpdateComments = async (req, res) => {
  try {
    const { commentIds, status } = req.body;

    await Comment.updateMany(
      { _id: { $in: commentIds } },
      { status }
    );

    res.json({ message: `${commentIds.length} comments updated successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get comment replies (public)
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    const replies = await Comment.find({ 
      parentComment: commentId,
      status: 'approved' 
    }).sort({ createdAt: 1 });

    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBlogComments,
  createComment,
  getAllComments,
  updateCommentStatus,
  deleteComment,
  getCommentStats,
  bulkUpdateComments,
  getCommentReplies
};
