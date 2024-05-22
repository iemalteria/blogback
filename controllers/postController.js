const Post = require('../models/Post');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const path = require('path');
const secret = 'fdsajiofhjdsa0989085r342';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.createPost = async (req, res) => {
    const { title, summary, content } = req.body;
    const file = req.file;

    try {
        const uploadedFile = await cloudinary.uploader.upload(file.path, {
            folder: 'uploads',
            transformation: { quality: 'auto' } // Puedes agregar más transformaciones aquí
        });

        const { secure_url, original_filename } = uploadedFile;

        const { token } = req.cookies;
        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) throw err;

            const postDoc = await Post.create({
                title,
                summary,
                content,
                cover: secure_url, // Guardamos la URL de la imagen en Cloudinary
                author: info.id,
            });

            res.status(201).json({ message: 'Post creado exitosamente', post: postDoc });
        });
    } catch (error) {
        console.error('Error al subir archivo a Cloudinary:', error);
        res.status(500).json('Error al subir archivo');
    }
};

exports.updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, summary, content } = req.body;
    const file = req.file;

    try {
        let updatedPost;
        if (file) {
            const uploadedFile = await cloudinary.uploader.upload(file.path, {
                folder: 'uploads',
                transformation: { quality: 'auto' } // Puedes agregar más transformaciones aquí
            });

            updatedPost = await Post.findByIdAndUpdate(id, {
                title,
                summary,
                content,
                cover: uploadedFile.secure_url, // Guardamos la URL de la imagen en Cloudinary
            }, { new: true });
        } else {
            updatedPost = await Post.findByIdAndUpdate(id, {
                title,
                summary,
                content,
            }, { new: true });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error al actualizar el post:', error);
        res.status(500).json('Error al actualizar el post');
    }
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

            // Eliminar la imagen de Cloudinary
            const public_id = postDoc.cover.split('/').slice(-1)[0].split('.')[0];
            await cloudinary.uploader.destroy(public_id);

            // Eliminar el post de la base de datos
            await Post.deleteOne({ _id: id });

            res.json('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json('Server error');
        }
    });
};
