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
        subcategory,
        level,
        format,
        institution,
        priceRange,
        rating,
        status = 'published',
        language,
        featured,
        instructor,
        minAge,
        maxAge,
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
        subcategory,
        level,
        format,
        institution,
        priceRange,
        rating,
        status,
        language,
        featured,
        instructor,
        minAge,
        maxAge,
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
          { titleAr: { $regex: search, $options: 'i' } },
          { titleEn: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { descriptionEn: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } },
          { shortDescriptionAr: { $regex: search, $options: 'i' } },
          { shortDescriptionEn: { $regex: search, $options: 'i' } },
          { instructor: { $regex: search, $options: 'i' } },
          { instructorAr: { $regex: search, $options: 'i' } },
          { instructorEn: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { categoryAr: { $regex: search, $options: 'i' } },
          { categoryEn: { $regex: search, $options: 'i' } },
          { subcategory: { $regex: search, $options: 'i' } },
          { subcategoryAr: { $regex: search, $options: 'i' } },
          { subcategoryEn: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { prerequisites: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      if (category && category !== 'all') query.category = category;
      if (subcategory && subcategory !== 'all') query.subcategory = subcategory;
      if (level && level !== 'all') query.level = level;
      if (format && format !== 'all') query.format = format;
      if (institution && institution !== 'all') query['institution.name'] = institution;
      if (language && language !== 'all') query.language = language;
      if (featured !== undefined && featured !== 'all') query.featured = featured === 'true';
      if (instructor && instructor !== 'all') query.instructor = instructor;
      if (minAge && minAge !== 'all') query.minAge = { $gte: parseInt(minAge) };
      if (maxAge && maxAge !== 'all') query.maxAge = { $lte: parseInt(maxAge) };
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

      // Set default values for new fields
      if (!courseData.currency) {
        courseData.currency = 'EGP';
      }

      if (!courseData.language) {
        courseData.language = 'English';
      }

      if (!courseData.certification) {
        courseData.certification = 'Certificate of Completion';
      }

      if (!courseData.status) {
        courseData.status = 'draft';
      }

      // Handle nested objects with defaults
      if (!courseData.studyStructure) {
        courseData.studyStructure = {
          semesters: 1,
          hasSummerCourse: false,
          hasGraduationProject: false,
          hasGraduationCeremony: false
        };
      }

      if (!courseData.attendancePolicy) {
        courseData.attendancePolicy = {
          allowedAbsencesPerMonth: 1,
          dismissalAfterAbsences: 2,
          requiresExcuse: true
        };
      }

      if (!courseData.paymentInstallments) {
        courseData.paymentInstallments = {
          enabled: false,
          numberOfInstallments: 1,
          installmentAmount: 0
        };
      }

      if (!courseData.weeklySchedule) {
        courseData.weeklySchedule = {
          day: '',
          startTime: '',
          endTime: '',
          duration: 0,
          platform: ''
        };
      }

      // Ensure arrays are properly initialized
      if (!courseData.prerequisites) {
        courseData.prerequisites = [];
      }

      if (!courseData.tags) {
        courseData.tags = [];
      }

      // Set percentage defaults based on format
      if (!courseData.onlinePercentage && !courseData.offlinePercentage) {
        switch (courseData.format) {
          case 'online':
            courseData.onlinePercentage = 100;
            courseData.offlinePercentage = 0;
            break;
          case 'offline':
            courseData.onlinePercentage = 0;
            courseData.offlinePercentage = 100;
            break;
          case 'hybrid':
            courseData.onlinePercentage = 50;
            courseData.offlinePercentage = 50;
            break;
          default:
            courseData.onlinePercentage = 100;
            courseData.offlinePercentage = 0;
        }
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

      // Debug logging
      console.log('Update course request:', {
        id,
        updateData: JSON.stringify(updateData, null, 2)
      });

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
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        console.error('Validation errors:', validationErrors);
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors.map(err => err.message),
          details: validationErrors
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

  // Get unique subcategories
  async getSubcategories(req, res) {
    try {
      const { category } = req.query;
      const query = { status: 'published' };
      if (category && category !== 'all') {
        query.category = category;
      }
      
      const subcategories = await Course.distinct('subcategory', query);
      
      res.status(200).json({
        status: 'success',
        data: { subcategories: subcategories.filter(Boolean).sort() }
      });
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subcategories',
        error: error.message
      });
    }
  }

  // Get unique languages
  async getLanguages(req, res) {
    try {
      const languages = await Course.distinct('language', { status: 'published' });
      
      res.status(200).json({
        status: 'success',
        data: { languages: languages.filter(Boolean).sort() }
      });
    } catch (error) {
      console.error('Error fetching languages:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch languages',
        error: error.message
      });
    }
  }

  // Get all unique tags
  async getTags(req, res) {
    try {
      const courses = await Course.find({ status: 'published' }, 'tags');
      const allTags = courses.reduce((tags, course) => {
        if (course.tags && Array.isArray(course.tags)) {
          tags.push(...course.tags);
        }
        return tags;
      }, []);
      
      const uniqueTags = [...new Set(allTags)].sort();
      
      res.status(200).json({
        status: 'success',
        data: { tags: uniqueTags }
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tags',
        error: error.message
      });
    }
  }

  // Toggle course featured status
  async toggleFeatured(req, res) {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id);
      
      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      course.featured = !course.featured;
      course.updatedBy = req.user?.id;
      await course.save();

      res.status(200).json({
        status: 'success',
        message: `Course ${course.featured ? 'featured' : 'unfeatured'} successfully`,
        data: { course }
      });
    } catch (error) {
      console.error('Error toggling featured status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to toggle featured status',
        error: error.message
      });
    }
  }

  // Get courses with advanced filtering
  async getAdvancedCourses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        categories = [],
        subcategories = [],
        levels = [],
        formats = [],
        languages = [],
        priceMin,
        priceMax,
        ratingMin,
        ageMin,
        ageMax,
        featured,
        hasPrerequisites,
        hasCertification,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { status: 'published' };

      // Advanced search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { titleAr: { $regex: search, $options: 'i' } },
          { titleEn: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { descriptionEn: { $regex: search, $options: 'i' } },
          { instructor: { $regex: search, $options: 'i' } },
          { instructorAr: { $regex: search, $options: 'i' } },
          { instructorEn: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Array filters
      if (categories.length > 0) query.category = { $in: categories };
      if (subcategories.length > 0) query.subcategory = { $in: subcategories };
      if (levels.length > 0) query.level = { $in: levels };
      if (formats.length > 0) query.format = { $in: formats };
      if (languages.length > 0) query.language = { $in: languages };

      // Range filters
      if (priceMin !== undefined || priceMax !== undefined) {
        query.price = {};
        if (priceMin !== undefined) query.price.$gte = parseFloat(priceMin);
        if (priceMax !== undefined) query.price.$lte = parseFloat(priceMax);
      }

      if (ratingMin !== undefined) {
        query.averageRating = { $gte: parseFloat(ratingMin) };
      }

      if (ageMin !== undefined || ageMax !== undefined) {
        if (ageMin !== undefined) query.minAge = { $lte: parseInt(ageMin) };
        if (ageMax !== undefined) query.maxAge = { $gte: parseInt(ageMax) };
      }

      // Boolean filters
      if (featured !== undefined) query.featured = featured === 'true';
      if (hasPrerequisites !== undefined) {
        query.prerequisites = hasPrerequisites === 'true' 
          ? { $exists: true, $not: { $size: 0 } }
          : { $or: [{ $exists: false }, { $size: 0 }] };
      }
      if (hasCertification !== undefined) {
        query.certification = hasCertification === 'true'
          ? { $exists: true, $ne: '' }
          : { $or: [{ $exists: false }, { $eq: '' }] };
      }

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [courses, total] = await Promise.all([
        Course.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'name email'),
        Course.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: {
          courses,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCourses: total,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching advanced courses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch courses',
        error: error.message
      });
    }
  }
}

module.exports = new CourseController();
