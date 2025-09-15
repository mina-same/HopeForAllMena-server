const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

class EnrollmentController {
  // Get all enrollments with pagination and filtering
  async getEnrollments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        courseId,
        studentId,
        paymentStatus,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

      // Use the static method from the model
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        courseId,
        paymentStatus,
        sortBy,
        sortOrder: sort
      };

      // Add timeout protection to prevent hanging requests
      const [enrollments, total] = await Promise.all([
        Promise.race([
          Enrollment.searchEnrollments(search, options),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Enrollment search timeout')), 10000)
          )
        ]),
        Promise.race([
          Enrollment.countDocuments(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Enrollment count timeout')), 5000)
          )
        ])
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          enrollments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalEnrollments: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch enrollments',
        error: error.message
      });
    }
  }

  // Get single enrollment by ID
  async getEnrollment(req, res) {
    try {
      const { id } = req.params;
      
      const enrollment = await Enrollment.findById(id)
        .populate('courseId', 'title instructor startDate endDate price institution')
        .populate('studentId', 'name email')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { enrollment }
      });
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch enrollment',
        error: error.message
      });
    }
  }

  // Create new enrollment
  async createEnrollment(req, res) {
    try {
      const enrollmentData = {
        ...req.body,
        createdBy: req.user?.id || req.body.createdBy
      };

      // Validate required fields
      const requiredFields = ['courseId', 'studentName', 'studentEmail'];
      const missingFields = requiredFields.filter(field => !enrollmentData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Check if course exists and has available seats
      const course = await Course.findById(enrollmentData.courseId);
      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found'
        });
      }

      if (course.availableSeats <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No available seats in this course'
        });
      }

      // Check for duplicate enrollment
      const existingEnrollment = await Enrollment.findOne({
        courseId: enrollmentData.courseId,
        studentEmail: enrollmentData.studentEmail.toLowerCase()
      });

      if (existingEnrollment) {
        return res.status(400).json({
          status: 'error',
          message: 'Student is already enrolled in this course'
        });
      }

      // Set payment amount from course price
      if (!enrollmentData.paymentAmount) {
        enrollmentData.paymentAmount = course.price;
      }

      // Set payment method and status for free courses
      if (course.price === 0) {
        enrollmentData.paymentMethod = 'free';
        enrollmentData.paymentStatus = 'paid';
      }

      const enrollment = new Enrollment(enrollmentData);
      await enrollment.save();

      // Update course enrollment count if approved
      if (enrollment.status === 'approved') {
        await course.incrementEnrollment();
      }

      const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('courseId', 'title instructor startDate endDate price institution')
        .populate('studentId', 'name email')
        .populate('createdBy', 'name email');

      res.status(201).json({
        status: 'success',
        message: 'Enrollment created successfully',
        data: { enrollment: populatedEnrollment }
      });
    } catch (error) {
      console.error('Error creating enrollment:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Student is already enrolled in this course'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create enrollment',
        error: error.message
      });
    }
  }

  // Update enrollment
  async updateEnrollment(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id || req.body.updatedBy
      };

      const oldEnrollment = await Enrollment.findById(id);
      if (!oldEnrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      const enrollment = await Enrollment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('courseId', 'title instructor startDate endDate price institution')
       .populate('studentId', 'name email')
       .populate('createdBy', 'name email')
       .populate('updatedBy', 'name email');

      // Update course enrollment count if status changed
      if (oldEnrollment.status !== enrollment.status) {
        const course = await Course.findById(enrollment.courseId);
        
        if (oldEnrollment.status === 'approved' && enrollment.status !== 'approved') {
          await course.decrementEnrollment();
        } else if (oldEnrollment.status !== 'approved' && enrollment.status === 'approved') {
          await course.incrementEnrollment();
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Enrollment updated successfully',
        data: { enrollment }
      });
    } catch (error) {
      console.error('Error updating enrollment:', error);
      
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
        message: 'Failed to update enrollment',
        error: error.message
      });
    }
  }

  // Delete enrollment
  async deleteEnrollment(req, res) {
    try {
      const { id } = req.params;
      
      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      // Update course enrollment count if enrollment was approved
      if (enrollment.status === 'approved') {
        const course = await Course.findById(enrollment.courseId);
        if (course) {
          await course.decrementEnrollment();
        }
      }

      await Enrollment.findByIdAndDelete(id);

      res.status(200).json({
        status: 'success',
        message: 'Enrollment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete enrollment',
        error: error.message
      });
    }
  }

  // Approve enrollment
  async approveEnrollment(req, res) {
    try {
      const { id } = req.params;
      const approvedBy = req.user?.id || req.body.approvedBy;
      
      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      if (enrollment.status === 'approved') {
        return res.status(400).json({
          status: 'error',
          message: 'Enrollment is already approved'
        });
      }

      // Check course availability
      const course = await Course.findById(enrollment.courseId);
      if (!course || course.availableSeats <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No available seats in this course'
        });
      }

      await enrollment.approve(approvedBy);
      await course.incrementEnrollment();

      const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('courseId', 'title instructor startDate endDate price institution')
        .populate('studentId', 'name email')
        .populate('updatedBy', 'name email');

      res.status(200).json({
        status: 'success',
        message: 'Enrollment approved successfully',
        data: { enrollment: populatedEnrollment }
      });
    } catch (error) {
      console.error('Error approving enrollment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve enrollment',
        error: error.message
      });
    }
  }

  // Reject enrollment
  async rejectEnrollment(req, res) {
    try {
      const { id } = req.params;
      const rejectedBy = req.user?.id || req.body.rejectedBy;
      
      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      if (enrollment.status === 'rejected') {
        return res.status(400).json({
          status: 'error',
          message: 'Enrollment is already rejected'
        });
      }

      // If enrollment was approved, decrement course enrollment
      if (enrollment.status === 'approved') {
        const course = await Course.findById(enrollment.courseId);
        if (course) {
          await course.decrementEnrollment();
        }
      }

      await enrollment.reject(rejectedBy);

      const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('courseId', 'title instructor startDate endDate price institution')
        .populate('studentId', 'name email')
        .populate('updatedBy', 'name email');

      res.status(200).json({
        status: 'success',
        message: 'Enrollment rejected successfully',
        data: { enrollment: populatedEnrollment }
      });
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reject enrollment',
        error: error.message
      });
    }
  }

  // Get enrollments by course
  async getEnrollmentsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const { status } = req.query;
      
      const enrollments = await Enrollment.getEnrollmentsByCourse(courseId, status);

      res.status(200).json({
        status: 'success',
        data: { enrollments }
      });
    } catch (error) {
      console.error('Error fetching enrollments by course:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch enrollments by course',
        error: error.message
      });
    }
  }

  // Get enrollments by student
  async getEnrollmentsByStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { status } = req.query;
      
      const enrollments = await Enrollment.getEnrollmentsByStudent(studentId, status);

      res.status(200).json({
        status: 'success',
        data: { enrollments }
      });
    } catch (error) {
      console.error('Error fetching enrollments by student:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch enrollments by student',
        error: error.message
      });
    }
  }

  // Get enrollment statistics
  async getEnrollmentStats(req, res) {
    try {
      const stats = await Enrollment.getStats();

      res.status(200).json({
        status: 'success',
        data: { stats }
      });
    } catch (error) {
      console.error('Error fetching enrollment statistics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch enrollment statistics',
        error: error.message
      });
    }
  }

  // Update enrollment progress
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { completedLessons, totalLessons } = req.body;

      if (completedLessons === undefined || totalLessons === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'completedLessons and totalLessons are required'
        });
      }

      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      await enrollment.updateProgress(completedLessons, totalLessons);

      res.status(200).json({
        status: 'success',
        message: 'Progress updated successfully',
        data: { 
          progress: enrollment.progress,
          status: enrollment.status
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update progress',
        error: error.message
      });
    }
  }

  // Add grade to enrollment
  async addGrade(req, res) {
    try {
      const { id } = req.params;
      const { assignment, score, feedback } = req.body;

      if (!assignment || score === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'Assignment and score are required'
        });
      }

      if (score < 0 || score > 100) {
        return res.status(400).json({
          status: 'error',
          message: 'Score must be between 0 and 100'
        });
      }

      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      await enrollment.addGrade(assignment, score, feedback);

      res.status(200).json({
        status: 'success',
        message: 'Grade added successfully',
        data: { 
          grades: enrollment.grades,
          overallGrade: enrollment.overallGrade
        }
      });
    } catch (error) {
      console.error('Error adding grade:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add grade',
        error: error.message
      });
    }
  }

  // Record attendance
  async recordAttendance(req, res) {
    try {
      const { id } = req.params;
      const { sessionDate, attended, duration, notes } = req.body;

      if (!sessionDate || attended === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'sessionDate and attended are required'
        });
      }

      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      await enrollment.recordAttendance(new Date(sessionDate), attended, duration, notes);

      res.status(200).json({
        status: 'success',
        message: 'Attendance recorded successfully',
        data: { 
          attendance: enrollment.attendance,
          attendanceRate: enrollment.attendanceRate
        }
      });
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to record attendance',
        error: error.message
      });
    }
  }

  // Add feedback to enrollment
  async addFeedback(req, res) {
    try {
      const { id } = req.params;
      const { rating, review, wouldRecommend } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          status: 'error',
          message: 'Rating must be between 1 and 5'
        });
      }

      const enrollment = await Enrollment.findById(id).populate('courseId');
      
      if (!enrollment) {
        return res.status(404).json({
          status: 'error',
          message: 'Enrollment not found'
        });
      }

      await enrollment.addFeedback(rating, review, wouldRecommend);

      // Update course rating
      if (enrollment.courseId) {
        await enrollment.courseId.updateRating(rating);
      }

      res.status(200).json({
        status: 'success',
        message: 'Feedback added successfully',
        data: { feedback: enrollment.feedback }
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add feedback',
        error: error.message
      });
    }
  }
}

module.exports = new EnrollmentController();
