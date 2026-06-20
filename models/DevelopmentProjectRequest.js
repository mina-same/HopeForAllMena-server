const mongoose = require('mongoose');

const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const personalInfoSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, match: emailRegex },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, min: 1 },
    marital_status: { type: String, enum: ['أعزب', 'متزوج', 'مطلق', 'أرمل'] },
    faith_testimony: { type: String, required: true, trim: true, minlength: 50 },
    church_membership_since: { type: String, trim: true }
  },
  { _id: false }
);

const churchBasicInfoSchema = new mongoose.Schema(
  {
    church_name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    denomination: { type: String, trim: true },
    established_year: { type: Number, min: 1900 },
    average_sunday_attendance: { type: Number, min: 1 },
    has_church_council: { type: Boolean, required: true },
    council_members_names: [{ type: String, trim: true }],
    church_community_photos: [{ type: String, match: urlRegex }]
  },
  { _id: false }
);

const projectCoreInfoSchema = new mongoose.Schema(
  {
    project_name: { type: String, required: true, trim: true },
    is_new_project: { type: Boolean, required: true },
    planned_start_date: { type: Date },
    requested_amount_egp: { type: Number, required: true, min: 0.01 },
    previously_received_this_grant: { type: Boolean, required: true },
    previous_grant_year: { type: Number, min: 2000 }
  },
  { _id: false }
);

const projectDetailedDescriptionSchema = new mongoose.Schema(
  {
    community_overview: { type: String, required: true, trim: true, minlength: 100 },
    number_and_types_of_churches: { type: String, trim: true },
    schools_in_area: { type: String, trim: true },
    government_and_public_services: { type: String, trim: true },
    other_community_features: { type: String, trim: true },

    similar_projects_exist: { type: Boolean, required: true },
    similar_projects_details: { type: String, trim: true },

    project_summary: { type: String, required: true, trim: true, minlength: 80 },
    goals: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: (m) => {
          const requiredKeys = ['روحية', 'اجتماعية', 'اقتصادية', 'أخرى'];
          return requiredKeys.every((k) => typeof m?.get(k) === 'string' && m.get(k).trim().length > 0);
        },
        message: 'goals must include روحية/اجتماعية/اقتصادية/أخرى as non-empty strings'
      }
    },
    how_goals_will_be_achieved: { type: String, required: true, trim: true, minlength: 100 },

    beneficiaries: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true
    },

    implementation_team: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          role: { type: String, required: true, trim: true },
          experience_qualifications: { type: String, required: true, trim: true }
        }
      ],
      default: []
    },

    beneficiaries_contribution: { type: String, required: true, trim: true },

    monitoring_responsible_name_or_committee: { type: String, required: true, trim: true },
    monitoring_responsible_position: { type: String, required: true, trim: true },
    monitoring_plan: { type: String, required: true, trim: true },

    sustainability_plan: { type: String, required: true, trim: true, minlength: 100 },
    expected_ongoing_income_sufficient: { type: Boolean, required: true },
    ongoing_funding_sources: { type: String, trim: true },

    church_contribution: {
      type: Map,
      of: String,
      required: true,
      validate: {
        validator: (m) => {
          const requiredKeys = ['مالية', 'بشرية', 'عينية', 'أخرى'];
          return requiredKeys.every((k) => typeof m?.get(k) === 'string' && m.get(k).trim().length > 0);
        },
        message: 'church_contribution must include مالية/بشرية/عينية/أخرى as non-empty strings'
      }
    },

    project_location_photos: [{ type: String, match: urlRegex }]
  },
  { _id: false }
);

const financialsSchema = new mongoose.Schema(
  {
    previous_year_church_income: { type: Number, min: 0.01 },
    previous_year_church_expenses: { type: Number, min: 0.01 },
    project_income_items: {
      type: [{ source: { type: String, required: true, trim: true }, amount: { type: Number, required: true, min: 0.01 } }],
      default: []
    },
    project_expense_items: {
      type: [{ item: { type: String, required: true, trim: true }, amount: { type: Number, required: true, min: 0.01 } }],
      default: []
    },
    previous_expenses_exempt_or_relevant: {
      type: [{ item: { type: String, required: true, trim: true }, amount: { type: Number, required: true, min: 0.01 } }],
      default: []
    }
  },
  { _id: false }
);

const commitmentsSchema = new mongoose.Schema(
  {
    no_political_use: { type: Boolean, default: true, immutable: true },
    religious_charitable_use_only: { type: Boolean, default: true, immutable: true },
    accept_10_percent_admin_fee: { type: Boolean, default: true, immutable: true },
    commit_to_annual_report_and_receipts: { type: Boolean, default: true, immutable: true },
    accept_2000_egp_withhold_last_payment: { type: Boolean, default: true, immutable: true }
  },
  { _id: false }
);

const developmentProjectRequestSchema = new mongoose.Schema(
  {
    applicant: { type: personalInfoSchema, required: true },
    church: { type: churchBasicInfoSchema, required: true },
    project_core: { type: projectCoreInfoSchema, required: true },
    project_details: { type: projectDetailedDescriptionSchema, required: true },
    financials: { type: financialsSchema, required: true },
    commitments: { type: commitmentsSchema, required: true },

    additional_attachments: [{ type: String, match: urlRegex }],
    submission_date: { type: Date, default: Date.now },
    applicant_signature_name: { type: String, required: true, trim: true },
    church_seal_applied: { type: Boolean },

    status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' },
    attachments: { type: [attachmentSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DevelopmentProjectRequest', developmentProjectRequestSchema);
