const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
