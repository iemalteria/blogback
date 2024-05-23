const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/api/post', postController.uploadMiddleware, postController.createPost);
router.put('/api/post', postController.uploadMiddleware, postController.updatePost);
router.get('/api/post', postController.getPosts);
router.get('/api/post/:id', postController.getPostById);
router.delete('/api/post/:id', postController.deletePost);

module.exports = router;