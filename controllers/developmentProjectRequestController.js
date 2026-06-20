const DevelopmentProjectRequest = require('../models/DevelopmentProjectRequest');
const fs = require('fs');
const path = require('path');

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return value;
}

function coerceNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return value;
}

function coerceDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return value;
}

function normalizeIncomingApplication(payload) {
  const app = payload?.application ? parseMaybeJson(payload.application) : payload;
  const normalized = parseMaybeJson(app);

  if (!normalized || typeof normalized !== 'object') return normalized;

  // Coerce known scalar types
  if (normalized.applicant) {
    normalized.applicant.age = coerceNumber(normalized.applicant.age);
  }
  if (normalized.church) {
    normalized.church.established_year = coerceNumber(normalized.church.established_year);
    normalized.church.average_sunday_attendance = coerceNumber(normalized.church.average_sunday_attendance);
    normalized.church.has_church_council = coerceBoolean(normalized.church.has_church_council);
  }
  if (normalized.project_core) {
    normalized.project_core.is_new_project = coerceBoolean(normalized.project_core.is_new_project);
    normalized.project_core.requested_amount_egp = coerceNumber(normalized.project_core.requested_amount_egp);
    normalized.project_core.previously_received_this_grant = coerceBoolean(normalized.project_core.previously_received_this_grant);
    normalized.project_core.previous_grant_year = coerceNumber(normalized.project_core.previous_grant_year);
    normalized.project_core.planned_start_date = coerceDate(normalized.project_core.planned_start_date);
  }
  if (normalized.project_details) {
    normalized.project_details.similar_projects_exist = coerceBoolean(normalized.project_details.similar_projects_exist);
    normalized.project_details.expected_ongoing_income_sufficient = coerceBoolean(normalized.project_details.expected_ongoing_income_sufficient);
  }
  if (normalized.financials) {
    normalized.financials.previous_year_church_income = coerceNumber(normalized.financials.previous_year_church_income);
    normalized.financials.previous_year_church_expenses = coerceNumber(normalized.financials.previous_year_church_expenses);
    if (Array.isArray(normalized.financials.project_income_items)) {
      normalized.financials.project_income_items = normalized.financials.project_income_items.map((x) => ({
        source: x?.source,
        amount: coerceNumber(x?.amount)
      }));
    }
    if (Array.isArray(normalized.financials.project_expense_items)) {
      normalized.financials.project_expense_items = normalized.financials.project_expense_items.map((x) => ({
        item: x?.item,
        amount: coerceNumber(x?.amount)
      }));
    }
    if (Array.isArray(normalized.financials.previous_expenses_exempt_or_relevant)) {
      normalized.financials.previous_expenses_exempt_or_relevant = normalized.financials.previous_expenses_exempt_or_relevant.map((x) => ({
        item: x?.item,
        amount: coerceNumber(x?.amount)
      }));
    }
  }

  normalized.submission_date = coerceDate(normalized.submission_date);
  normalized.church_seal_applied = coerceBoolean(normalized.church_seal_applied);

  // Commitments are const True in the schema; if missing, set defaults.
  normalized.commitments = normalized.commitments || {};
  normalized.commitments.no_political_use = true;
  normalized.commitments.religious_charitable_use_only = true;
  normalized.commitments.accept_10_percent_admin_fee = true;
  normalized.commitments.commit_to_annual_report_and_receipts = true;
  normalized.commitments.accept_2000_egp_withhold_last_payment = true;

  return normalized;
}

// Create new development project request (Public)
const createDevelopmentProjectRequest = async (req, res) => {
  try {
    const payload = normalizeIncomingApplication(req.body);

    // Process uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path
        });
      });
    }

    const request = new DevelopmentProjectRequest({ ...payload, attachments });

    const saved = await request.save();
    res.status(201).json(saved);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating development project request', error: error.message });
  }
};

// Get all development project requests (Admin)
const getAllDevelopmentProjectRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const requests = await DevelopmentProjectRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DevelopmentProjectRequest.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching development project requests', error: error.message });
  }
};

// Get a single request by ID (Admin)
const getDevelopmentProjectRequestById = async (req, res) => {
  try {
    const request = await DevelopmentProjectRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Development project request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching development project request', error: error.message });
  }
};

// Update request status (Admin)
const updateDevelopmentProjectRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await DevelopmentProjectRequest.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Development project request not found' });
    }

    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating development project request status', error: error.message });
  }
};

// Download attachment (Admin)
const downloadAttachment = async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    // Find the request to verify the attachment exists
    const request = await DevelopmentProjectRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify the attachment belongs to this request
    const attachment = request.attachments.find(att => att.filename === filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check if file exists
    const filePath = path.join(__dirname, '../uploads/project-requests', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading attachment', error: error.message });
  }
};

module.exports = {
  createDevelopmentProjectRequest,
  getAllDevelopmentProjectRequests,
  getDevelopmentProjectRequestById,
  updateDevelopmentProjectRequestStatus,
  downloadAttachment
};
