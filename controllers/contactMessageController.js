const ContactMessage = require('../models/ContactMessage');
const Book = require('../models/Book');

class ContactMessageController {
  // Get all contact messages with pagination and filtering
  async getContactMessages(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status,
        type,
        priority,
        assignedTo,
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
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sort };

      // Get contact messages with pagination
      const [messages, total] = await Promise.all([
        ContactMessage.find(query)
          .populate('book', 'title coverImageUrl author price')
          .populate('book.author', 'name')
          .populate('assignedTo', 'name username')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        ContactMessage.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          messages,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalMessages: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get contact messages error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve contact messages'
      });
    }
  }

  // Get contact message statistics
  async getContactMessageStats(req, res) {
    try {
      const stats = await ContactMessage.getStats();
      
      // Get recent messages (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMessages = await ContactMessage.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get messages by type distribution
      const typeDistribution = await ContactMessage.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get messages by priority distribution
      const priorityDistribution = await ContactMessage.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get recent book orders
      const recentBookOrders = await ContactMessage.find({
        type: 'book-order',
        createdAt: { $gte: thirtyDaysAgo }
      })
        .populate('book', 'title coverImageUrl author price')
        .populate('book.author', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      res.status(200).json({
        status: 'success',
        data: {
          ...stats,
          recentMessages,
          typeDistribution,
          priorityDistribution,
          recentBookOrders
        }
      });

    } catch (error) {
      console.error('Get contact message stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve contact message statistics'
      });
    }
  }

  // Get contact message by ID
  async getContactMessageById(req, res) {
    try {
      const message = await ContactMessage.findById(req.params.id)
        .populate('book', 'title coverImageUrl author price')
        .populate('book.author', 'name')
        .populate('assignedTo', 'name username email')
        .populate('response.respondedBy', 'name username');
      
      if (!message) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          message
        }
      });

    } catch (error) {
      console.error('Get contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve contact message'
      });
    }
  }

  // Create new contact message
  async createContactMessage(req, res) {
    try {
      const { 
        name, 
        email, 
        phone, 
        subject, 
        message, 
        type = 'general',
        bookTitle,
        bookAuthor,
        book,
        quantity = 1,
        preferredContactMethod = 'email',
        source = 'website',
        ipAddress,
        userAgent
      } = req.body;

      // Validate book exists if provided
      if (book) {
        const bookExists = await Book.findById(book);
        if (!bookExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Book not found'
          });
        }
      }

      // Create new contact message
      const contactMessage = new ContactMessage({
        name,
        email: email.toLowerCase(),
        phone,
        subject,
        message,
        type,
        bookTitle,
        bookAuthor,
        book,
        quantity: parseInt(quantity),
        preferredContactMethod,
        source,
        ipAddress,
        userAgent,
        status: 'new'
      });

      await contactMessage.save();

      // Populate the message with book data if exists
      if (book) {
        await contactMessage.populate('book', 'title coverImageUrl author price');
        await contactMessage.populate('book.author', 'name');
      }

      res.status(201).json({
        status: 'success',
        message: 'Contact message submitted successfully',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Create contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create contact message'
      });
    }
  }

  // Update contact message
  async updateContactMessage(req, res) {
    try {
      const { 
        name, 
        email, 
        phone, 
        subject, 
        message, 
        type,
        bookTitle,
        bookAuthor,
        book,
        quantity,
        preferredContactMethod,
        priority,
        tags,
        notes
      } = req.body;
      const messageId = req.params.id;

      // Check if message exists
      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Validate book exists if provided
      if (book) {
        const bookExists = await Book.findById(book);
        if (!bookExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Book not found'
          });
        }
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone;
      if (subject) updateData.subject = subject;
      if (message) updateData.message = message;
      if (type) updateData.type = type;
      if (bookTitle !== undefined) updateData.bookTitle = bookTitle;
      if (bookAuthor !== undefined) updateData.bookAuthor = bookAuthor;
      if (book !== undefined) updateData.book = book;
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (preferredContactMethod) updateData.preferredContactMethod = preferredContactMethod;
      if (priority) updateData.priority = priority;
      if (tags !== undefined) updateData.tags = tags;
      if (notes !== undefined) updateData.notes = notes;

      // Update contact message
      const updatedMessage = await ContactMessage.findByIdAndUpdate(
        messageId,
        updateData,
        { new: true, runValidators: true }
      ).populate('book', 'title coverImageUrl author price')
       .populate('book.author', 'name')
       .populate('assignedTo', 'name username');

      res.status(200).json({
        status: 'success',
        message: 'Contact message updated successfully',
        data: {
          message: updatedMessage
        }
      });

    } catch (error) {
      console.error('Update contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update contact message'
      });
    }
  }

  // Delete contact message
  async deleteContactMessage(req, res) {
    try {
      const messageId = req.params.id;

      // Check if message exists
      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Delete contact message
      await ContactMessage.findByIdAndDelete(messageId);

      res.status(200).json({
        status: 'success',
        message: 'Contact message deleted successfully'
      });

    } catch (error) {
      console.error('Delete contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete contact message'
      });
    }
  }

  // Update contact message status
  async updateContactMessageStatus(req, res) {
    try {
      const { status } = req.body;
      const messageId = req.params.id;

      if (!status || !['new', 'read', 'in-progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid status is required (new, read, in-progress, resolved, or closed)'
        });
      }

      const contactMessage = await ContactMessage.findByIdAndUpdate(
        messageId,
        { status },
        { new: true, runValidators: true }
      ).populate('book', 'title coverImageUrl author price')
       .populate('book.author', 'name')
       .populate('assignedTo', 'name username');

      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Contact message ${status} successfully`,
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Update contact message status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update contact message status'
      });
    }
  }

  // Assign contact message to user
  async assignContactMessage(req, res) {
    try {
      const { assignedTo } = req.body;
      const messageId = req.params.id;

      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Assign the message
      await contactMessage.assignTo(assignedTo);

      // Populate the updated message
      await contactMessage.populate('book', 'title coverImageUrl author price');
      await contactMessage.populate('book.author', 'name');
      await contactMessage.populate('assignedTo', 'name username');

      res.status(200).json({
        status: 'success',
        message: 'Contact message assigned successfully',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Assign contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign contact message'
      });
    }
  }

  // Respond to contact message
  async respondToContactMessage(req, res) {
    try {
      const { content } = req.body;
      const messageId = req.params.id;
      const userId = req.user._id;

      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Respond to the message
      await contactMessage.respond(content, userId);

      // Populate the updated message
      await contactMessage.populate('book', 'title coverImageUrl author price');
      await contactMessage.populate('book.author', 'name');
      await contactMessage.populate('assignedTo', 'name username');
      await contactMessage.populate('response.respondedBy', 'name username');

      res.status(200).json({
        status: 'success',
        message: 'Response sent successfully',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Respond to contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to respond to contact message'
      });
    }
  }

  // Close contact message
  async closeContactMessage(req, res) {
    try {
      const messageId = req.params.id;

      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Close the message
      await contactMessage.close();

      // Populate the updated message
      await contactMessage.populate('book', 'title coverImageUrl author price');
      await contactMessage.populate('book.author', 'name');
      await contactMessage.populate('assignedTo', 'name username');

      res.status(200).json({
        status: 'success',
        message: 'Contact message closed successfully',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Close contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to close contact message'
      });
    }
  }

  // Add note to contact message
  async addNoteToContactMessage(req, res) {
    try {
      const { note } = req.body;
      const messageId = req.params.id;

      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Add note
      await contactMessage.addNote(note);

      res.status(200).json({
        status: 'success',
        message: 'Note added successfully',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Add note to contact message error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add note to contact message'
      });
    }
  }

  // Get book order messages
  async getBookOrders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      const messages = await ContactMessage.getBookOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder: sortOrder === 'asc' ? 1 : -1
      });

      const total = await ContactMessage.countDocuments({ 
        type: 'book-order',
        ...(status ? { status } : {})
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          messages,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalMessages: total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get book orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve book orders'
      });
    }
  }

  // Get recent messages
  async getRecentMessages(req, res) {
    try {
      const { limit = 10 } = req.query;

      const messages = await ContactMessage.getRecentMessages(parseInt(limit));

      res.status(200).json({
        status: 'success',
        data: {
          messages
        }
      });

    } catch (error) {
      console.error('Get recent messages error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve recent messages'
      });
    }
  }

  // Mark message as read
  async markAsRead(req, res) {
    try {
      const messageId = req.params.id;

      const contactMessage = await ContactMessage.findById(messageId);
      if (!contactMessage) {
        return res.status(404).json({
          status: 'error',
          message: 'Contact message not found'
        });
      }

      // Mark as read
      await contactMessage.markAsRead();

      res.status(200).json({
        status: 'success',
        message: 'Contact message marked as read',
        data: {
          message: contactMessage
        }
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark contact message as read'
      });
    }
  }
}

module.exports = new ContactMessageController();
