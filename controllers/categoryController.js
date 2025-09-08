const Category = require('../models/Category');
const Book = require('../models/Book');
const mongoose = require('mongoose');

class CategoryController {
  // Get all categories with pagination and filtering
  async getCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        parentCategory,
        sortBy = 'sortOrder',
        sortOrder = 'asc'
      } = req.query;

      // Convert sortOrder to number
      const sort = sortOrder === 'desc' || sortOrder === '-1' ? -1 : 1;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { name_en: { $regex: search, $options: 'i' } },
          { name_ar: { $regex: search, $options: 'i' } },
          { description_en: { $regex: search, $options: 'i' } },
          { description_ar: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) query.status = status;
      if (parentCategory) query.parentCategory = parentCategory;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get categories with pagination
      const [categories, total] = await Promise.all([
        Category.find(query)
          .populate('parentCategory', 'name slug')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Category.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          categories,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCategories: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve categories'
      });
    }
  }

  // Get category statistics
  async getCategoryStats(req, res) {
    try {
      const stats = await Category.getStats();
      
      // Get recent categories (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCategories = await Category.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get top categories by books count
      const topCategories = await Category.find({ status: 'active' })
        .sort({ booksCount: -1 })
        .limit(5)
        .select('name booksCount color');

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentCategories,
          topCategories
        }
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category statistics'
      });
    }
  }

  // Get category by ID
  async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id)
        .populate('parentCategory', 'name slug color');
      
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Get category's books
      const books = await Book.find({ category: category._id, status: 'published' })
        .populate('author', 'name avatarUrl')
        .select('title coverImageUrl author averageRating totalReviews publicationDate')
        .sort({ publicationDate: -1 });

      // Get subcategories if this is a parent category
      const subcategories = await Category.find({ 
        parentCategory: category._id, 
        status: 'active' 
      }).select('name slug description booksCount color');

      res.status(200).json({
        status: 'success',
        data: {
          category,
          books,
          subcategories
        }
      });

    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category'
      });
    }
  }

  // Get category hierarchy
  async getCategoryHierarchy(req, res) {
    try {
      const categories = await Category.getHierarchy();

      res.status(200).json({
        status: 'success',
        data: {
          categories
        }
      });

    } catch (error) {
      console.error('Get category hierarchy error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category hierarchy'
      });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      console.log('Create category request body:', req.body); // Debug log
      
      const { 
        name_en, 
        name_ar,
        description_en, 
        description_ar,
        icon = 'Book', 
        color = 'bg-blue-100 text-blue-800 border-blue-200',
        parentCategory,
        status = 'active',
        sortOrder = 0
      } = req.body;

      // Validate required fields
      if (!name_en || !name_en.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Category name (English) is required'
        });
      }

      if (!name_ar || !name_ar.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Category name (Arabic) is required'
        });
      }

      if (!description_en || !description_en.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Category description (English) is required'
        });
      }

      if (!description_ar || !description_ar.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Category description (Arabic) is required'
        });
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({
        $or: [
          { name_en: { $regex: new RegExp(`^${name_en}$`, 'i') } },
          { name_ar: { $regex: new RegExp(`^${name_ar}$`, 'i') } }
        ]
      });

      console.log('Checking for existing category with names:', { name_en, name_ar });
      console.log('Found existing category:', existingCategory);

      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Category name is already taken. Please choose a different name.',
          field: 'name',
          suggestion: 'Try adding a descriptive word or number to make it unique'
        });
      }

      // Validate parent category if provided
      if (parentCategory && parentCategory !== null && parentCategory !== '' && parentCategory !== 'none') {
        // Check if parentCategory is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid parent category ID format'
          });
        }
        
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({
            status: 'error',
            message: 'Parent category not found'
          });
        }
      }

      // Clean up parentCategory value
      const cleanParentCategory = (parentCategory === null || parentCategory === '' || parentCategory === 'none') ? null : parentCategory;

      // Create new category
      const category = new Category({
        name_en,
        name_ar,
        description_en,
        description_ar,
        icon,
        color,
        parentCategory: cleanParentCategory,
        status,
        sortOrder
      });

      await category.save();

      // Populate parent category if exists
      if (cleanParentCategory) {
        await category.populate('parentCategory', 'name slug');
      }

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: {
          category
        }
      });

    } catch (error) {
      console.error('Create category error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          status: 'error',
          message: validationErrors[0] || 'Validation failed',
          errors: validationErrors
        });
      }
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'name' ? 'Name' : field === 'slug' ? 'Slug' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field === 'name' ? 'name' : field === 'slug' ? 'slug' : field}.`,
          field: field,
          suggestion: field === 'name' ? 'Try adding a descriptive word or number' : 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create category'
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { 
        name_en, 
        name_ar,
        description_en, 
        description_ar,
        icon, 
        color, 
        parentCategory, 
        status, 
        sortOrder
      } = req.body;
      const categoryId = req.params.id;

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Check if name is already taken by another category
      if (name_en || name_ar) {
        const existingCategory = await Category.findOne({
          _id: { $ne: categoryId },
          $or: [
            ...(name_en ? [{ name_en: { $regex: new RegExp(`^${name_en}$`, 'i') } }] : []),
            ...(name_ar ? [{ name_ar: { $regex: new RegExp(`^${name_ar}$`, 'i') } }] : [])
          ]
        });

        if (existingCategory) {
          return res.status(400).json({
            status: 'error',
            message: 'Category name is already taken by another category. Please choose a different name.',
            field: 'name',
            suggestion: 'Try adding a descriptive word or number to make it unique'
          });
        }
      }

      // Validate parent category if provided
      if (parentCategory && parentCategory !== null && parentCategory !== '' && parentCategory !== 'none') {
        if (parentCategory === categoryId) {
          return res.status(400).json({
            status: 'error',
            message: 'Category cannot be its own parent'
          });
        }

        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({
            status: 'error',
            message: 'Parent category not found'
          });
        }
      }

      // Clean up parentCategory value
      const cleanParentCategory = (parentCategory === null || parentCategory === '' || parentCategory === 'none') ? null : parentCategory;

      // Prepare update data
      const updateData = {};
      if (name_en) updateData.name_en = name_en;
      if (name_ar) updateData.name_ar = name_ar;
      if (description_en) updateData.description_en = description_en;
      if (description_ar) updateData.description_ar = description_ar;
      if (icon) updateData.icon = icon;
      if (color) updateData.color = color;
      if (parentCategory !== undefined) updateData.parentCategory = cleanParentCategory;
      if (status) updateData.status = status;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      // Update category
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      ).populate('parentCategory', 'name slug');

      res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: {
          category: updatedCategory
        }
      });

    } catch (error) {
      console.error('Update category error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'name' ? 'Name' : field === 'slug' ? 'Slug' : field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(400).json({
          status: 'error',
          message: `${fieldName} is already taken. Please choose a different ${field === 'name' ? 'name' : field === 'slug' ? 'slug' : field}.`,
          field: field,
          suggestion: field === 'name' ? 'Try adding a descriptive word or number' : 'This value must be unique'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update category'
      });
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Check if category has books
      const booksCount = await Book.countDocuments({ category: categoryId });
      if (booksCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete category. This category has ${booksCount} book${booksCount !== 1 ? 's' : ''} associated with it. Please reassign or delete the books first.`,
          booksCount
        });
      }

      // Check if category has subcategories
      const subcategoriesCount = await Category.countDocuments({ parentCategory: categoryId });
      if (subcategoriesCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete category. This category has ${subcategoriesCount} subcategor${subcategoriesCount !== 1 ? 'ies' : 'y'}. Please delete or reassign the subcategories first.`,
          subcategoriesCount
        });
      }

      // Delete category
      await Category.findByIdAndDelete(categoryId);

      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete category'
      });
    }
  }

  // Update category status
  async updateCategoryStatus(req, res) {
    try {
      const { status } = req.body;
      const categoryId = req.params.id;

      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (active or inactive)'
        });
      }

      const category = await Category.findByIdAndUpdate(
        categoryId,
        { status },
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Category ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: {
          category
        }
      });

    } catch (error) {
      console.error('Update category status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category status'
      });
    }
  }


  // Update category's books count
  async updateCategoryStats(req, res) {
    try {
      const categoryId = req.params.id;

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Update books count
      await category.updateBooksCount();

      // Refresh category data
      const updatedCategory = await Category.findById(categoryId);

      res.status(200).json({
        status: 'success',
        message: 'Category statistics updated successfully',
        data: {
          category: updatedCategory
        }
      });

    } catch (error) {
      console.error('Update category stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category statistics'
      });
    }
  }
}

module.exports = new CategoryController();
