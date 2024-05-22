const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = 'fdsajiofhjdsa0989085r342';
const salt = bcrypt.genSaltSync(10);

exports.register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch (e) {
        res.status(400).json(e);
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { httpOnly: true, sameSite: 'None', secure: true }).json({
                id: userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('Credenciales Incorrectas');
    }
};

exports.profile = (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json('Token missing');
    }
    jwt.verify(token, secret, (err, info) => {
        if (err) {
            return res.status(401).json('Invalid token');
        }
        res.json(info);
    });
};

exports.logout = (req, res) => {
    res.cookie('token', '', { httpOnly: true, sameSite: 'None', secure: true }).json('ok');
};
