const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middleware/uploadMiddleware'); // Asegúrate de tener este middleware configurado correctamente

router.post('/api/post', upload.single('file'), postController.createPost); // Usamos multer para subir el archivo
router.put('/api/post/:id', upload.single('file'), postController.updatePost); // Usamos multer para subir el archivo
router.get('/api/post', postController.getPosts);
router.get('/api/post/:id', postController.getPostById);
router.delete('/api/post/:id', postController.deletePost);

module.exports = router;
