const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkcui067d',
  api_key: process.env.CLOUDINARY_API_KEY || '378168273153864',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'WVD6FI43h62qKFjCFKxUAYEL4XE'
});

module.exports = cloudinary;
