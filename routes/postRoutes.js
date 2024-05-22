const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middleware/uploadMiddleware'); // Middleware for handling file uploads

// Route for creating a new post
router.post('/api/post', upload.single('file'), postController.createPost); // Use multer middleware

// Other routes
router.put('/api/post/:id', upload.single('file'), postController.updatePost);
router.get('/api/post', postController.getPosts);
router.get('/api/post/:id', postController.getPostById);
router.delete('/api/post/:id', postController.deletePost);

module.exports = router;
