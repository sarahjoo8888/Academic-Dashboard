const router = require('express').Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
        const result = await pool.query(
            'INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING user_uuid, full_name, email, created_at',
            [full_name, email, hashedPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign(
            { user_uuid: user.user_uuid, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({ user, token });
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({ message: 'Email already in use' });
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        const user = result.rows[0];
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });

        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword)
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { user_uuid: user.user_uuid, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        const { password: _, ...safeUser } = user; // Exclude password from response
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;