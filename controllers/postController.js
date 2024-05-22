const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const secret = 'fdsajiofhjdsa0989085r342';

const uploadMiddleware = multer({ dest: 'uploads/' });

exports.uploadMiddleware = uploadMiddleware.single('file');

exports.createPost = async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        res.json(postDoc);
    });
};

exports.updatePost = async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('Autor invalido');
        }

        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });

        res.json(postDoc);
    });
};

exports.getPosts = async (req, res) => {
    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );
};

exports.getPostById = async (req, res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
};

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            return res.status(401).json('Unauthorized');
        }

        try {
            const postDoc = await Post.findById(id);
            if (!postDoc) {
                return res.status(404).json('Post not found');
            }

            const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
            if (!isAuthor) {
                return res.status(403).json('Forbidden');
            }

            // Eliminar la imagen de la carpeta de uploads
            const imagePath = path.join(__dirname, postDoc.cover);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            // Eliminar el post de la base de datos
            await Post.deleteOne({ _id: id });

            res.json('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json('Server error');
        }
    });
};
