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
        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const uploadedFile = await cloudinary.uploader.upload(file.path, {
            folder: 'uploads',
            transformation: { quality: 'auto' }
        });

        const { secure_url, original_filename } = uploadedFile;

        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) {
                console.error('JWT verification error:', err);
                return res.status(403).json({ error: 'Invalid token' });
            }

            const postDoc = await Post.create({
                title,
                summary,
                content,
                cover: secure_url,
                author: info.id,
            });

            res.status(201).json({ message: 'Post created successfully', post: postDoc });
        });
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
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
                transformation: { quality: 'auto' }
            });

            updatedPost = await Post.findByIdAndUpdate(id, {
                title,
                summary,
                content,
                cover: uploadedFile.secure_url,
            }, { new: true });
        } else {
            updatedPost = await Post.findByIdAndUpdate(id, {
                title,
                summary,
                content,
            }, { new: true });
        }

        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.getPostById = async (req, res) => {
    const { id } = req.params;

    try {
        const postDoc = await Post.findById(id).populate('author', ['username']);
        if (!postDoc) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(postDoc);
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: 'Invalid token' });
        }

        try {
            const postDoc = await Post.findById(id);
            if (!postDoc) {
                return res.status(404).json({ error: 'Post not found' });
            }

            if (postDoc.author.toString() !== info.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const public_id = postDoc.cover.split('/').slice(-1)[0].split('.')[0];
            await cloudinary.uploader.destroy(public_id);

            await Post.deleteOne({ _id: id });

            res.json({ message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    });
};
