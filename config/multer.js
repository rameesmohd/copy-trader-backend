const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Multer Cloudinary Storage
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => ({
//     folder: 'support_tickets',
//     format: file.mimetype.split('/')[1], // Auto-detect format
//     public_id: Date.now() + '-' + file.originalname,
//     resource_type: "auto" // Auto-detect file type (image, pdf, etc.)
//   }),
// });

// // Validate File Type
// const fileFilter = (req, file, cb) => {
//     if (!file.mimetype.startsWith("image/")) {
//         return cb(new Error("Only images are allowed!"), false);
//     }
//     cb(null, true);
// };

// // Configure Multer
// const upload = multer({ 
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
//     fileFilter
// });

// 🔹 Configure Multer Storage (Save in "uploads" Folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 🔹 Save files in "uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // 🔹 Rename files
  },
});

// 🔹 File Filter (Accept Only Images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg, .png files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
