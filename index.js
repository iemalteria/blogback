const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

const corsOptions = {
    origin: ['https://iemalteria-front.vercel.app', 'http://localhost:3000'],
    credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer con Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        format: async (req, file) => 'jpg', // Puedes cambiar el formato según sea necesario
        public_id: (req, file) => `${Date.now().toString()}-${file.originalname}`,
    },
});

const upload = multer({ storage: storage });

// Ruta para manejar la subida de archivos
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.status(200).json({ message: 'Archivo subido con éxito', fileUrl: req.file.path });
});

mongoose.connect('mongodb+srv://institucionmalteria:400PEpqcSrJmnMXG@cluster0.css22m8.mongodb.net', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(authRoutes);
app.use(postRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
