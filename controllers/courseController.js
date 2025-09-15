const Course = require('../models/Course');
const User = require('../models/User');

class CourseController {
  // Get all courses with pagination and filtering
  async getCourses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        category,
        level,
        format,
        institution,
        priceRange,
        rating,
        status = 'published',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Use the static method from the model
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        level,
        format,
        institution,
        priceRange,
        rating,
        status,
        sortBy,
        sortOrder: sort
      };

      // Add timeout to prevent hanging requests
      const coursesPromise = Course.searchCourses(search, options);
      const courses = await Promise.race([
        coursesPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      // Build the same query for counting
      const query = { status };
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { instructor: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      if (category && category !== 'all') query.category = category;
      if (level && level !== 'all') query.level = level;
      if (format && format !== 'all') query.format = format;
      if (institution && institution !== 'all') query['institution.name'] = institution;
      if (priceRange && priceRange !== 'all') {
        switch (priceRange) {
          case 'free': query.price = 0; break;
          case 'under-500': query.price = { $gt: 0, $lt: 500 }; break;
          case '500-1000': query.price = { $gte: 500, $lt: 1000 }; break;
          case '1000-2000': query.price = { $gte: 1000, $lt: 2000 }; break;
          case 'over-2000': query.price = { $gte: 2000 }; break;
        }
      }
      if (rating && rating !== 'all') {
        query.averageRating = { $gte: parseFloat(rating) };
      }
      
      // Add timeout to count query as well
      const countPromise = Course.countDocuments(query);
      const total = await Promise.race([
        countPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Count query timeout')), 5000)
        )
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          courses,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCourses: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch courses',
        error: error.message
      });
    }
  }

  // Get single course by ID
  async getCourse(req, res) {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { course }
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch course',
        error: error.message
      });
    }
  }

  // Create new course
  async createCourse(req, res) {
    try {
      const courseData = {
        ...req.body,
        createdBy: req.user?.id || req.body.createdBy
      };

      // Validate required fields
      const requiredFields = ['title', 'description', 'category', 'level', 'format', 'price', 'startDate', 'instructor', 'institution', 'maxStudents'];
      const missingFields = requiredFields.filter(field => !courseData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Set default values
      if (!courseData.availableSeats) {
        courseData.availableSeats = courseData.maxStudents;
      }

      if (!courseData.shortDescription && courseData.description) {
        courseData.shortDescription = courseData.description.substring(0, 300);
      }

      const course = new Course(courseData);
      await course.save();

      const populatedCourse = await Course.findById(course._id)
        .populate('createdBy', 'name email');

      res.status(201).json({
        status: 'success',
        message: 'Course created successfully',
        data: { course: populatedCourse }
      });
    } catch (error) {
      console.error('Error creating course:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create course',
        error: error.message
      });
    }
  }

  // Update course
  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id || req.body.updatedBy
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.totalEnrollments;
      delete updateData.averageRating;
      delete updateData.totalRatings;

      const course = await Course.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email')
       .populate('updatedBy', 'name email');

      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Course updated successfully',
        data: { course }
      });
    } catch (error) {
      console.error('Error updating course:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update course',
        error: error.message
      });
    }
  }

  // Delete course
  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id);
      
      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      // Check if course has enrollments
      const Enrollment = require('../models/Enrollment');
      const enrollmentCount = await Enrollment.countDocuments({ courseId: id });
      
      if (enrollmentCount > 0) {
        // Archive instead of delete if there are enrollments
        course.status = 'archived';
        await course.save();
        
        return res.status(200).json({
          status: 'success',
          message: 'Course archived successfully (had active enrollments)',
          data: { course }
        });
      }

      await Course.findByIdAndDelete(id);

      res.status(200).json({
        status: 'success',
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete course',
        error: error.message
      });
    }
  }

  // Get featured courses
  async getFeaturedCourses(req, res) {
    try {
      const { limit = 6 } = req.query;
      
      const courses = await Course.getFeaturedCourses(parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: { courses }
      });
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch featured courses',
        error: error.message
      });
    }
  }

  // Get courses by category
  async getCoursesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 10 } = req.query;
      
      const courses = await Course.getCoursesByCategory(category, parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: { courses }
      });
    } catch (error) {
      console.error('Error fetching courses by category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch courses by category',
        error: error.message
      });
    }
  }

  // Get course statistics
  async getCourseStats(req, res) {
    try {
      const stats = await Course.getStats();

      res.status(200).json({
        status: 'success',
        data: { stats }
      });
    } catch (error) {
      console.error('Error fetching course statistics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch course statistics',
        error: error.message
      });
    }
  }

  // Update course rating
  async updateCourseRating(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          status: 'error',
          message: 'Rating must be between 1 and 5'
        });
      }

      const course = await Course.findById(id);
      
      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      await course.updateRating(rating);

      res.status(200).json({
        status: 'success',
        message: 'Course rating updated successfully',
        data: { 
          averageRating: course.averageRating,
          totalRatings: course.totalRatings
        }
      });
    } catch (error) {
      console.error('Error updating course rating:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update course rating',
        error: error.message
      });
    }
  }

  // Get unique categories
  async getCategories(req, res) {
    try {
      const categories = await Course.distinct('category', { status: 'published' });
      
      res.status(200).json({
        status: 'success',
        data: { categories: categories.sort() }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get unique institutions
  async getInstitutions(req, res) {
    try {
      const institutions = await Course.distinct('institution', { status: 'published' });
      
      res.status(200).json({
        status: 'success',
        data: { institutions }
      });
    } catch (error) {
      console.error('Error fetching institutions:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch institutions',
        error: error.message
      });
    }
  }

  // Get unique instructors
  async getInstructors(req, res) {
    try {
      const instructors = await Course.distinct('instructor', { status: 'published' });
      
      res.status(200).json({
        status: 'success',
        data: { instructors: instructors.sort() }
      });
    } catch (error) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch instructors',
        error: error.message
      });
    }
  }
}

module.exports = new CourseController();
