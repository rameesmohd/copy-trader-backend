const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Optional folder in Cloudinary
    format: async (req, file) => 'jpg', // Optional: Set the format of the file (e.g., jpg, png)
    public_id: (req, file) => file.originalname.split('.')[0], // Optional: Use the original filename
  },
});

const upload = multer({ storage: storage });

module.exports = upload
