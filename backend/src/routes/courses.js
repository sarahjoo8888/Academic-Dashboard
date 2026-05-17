const router = require('express').Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/courses
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT * FROM courses WHERE user_uuid = $1 ORDER BY name',
        [req.user.user_uuid]
    );
    res.json({ courses: rows });
});

// POST /api/courses
router.post('/', async (req, res) => {
    const { name, colour } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Course name is required' });
    }
    const { rows } = await pool.query(
        'INSERT INTO courses (user_uuid, name, colour) VALUES ($1, $2, $3) RETURNING *',
        [req.user.user_uuid, name, colour || '#C9B8F0']
    );
    res.status(201).json({ course: rows[0] });
});

// PATCH /api/courses/:course_uuid
router.patch('/:course_uuid', async (req, res) => {
    const { name, colour } = req.body;
    const { rows } = await pool.query(
        'UPDATE courses SET name = COALESCE($1, name), colour = COALESCE($2, colour) WHERE course_uuid = $3 AND user_uuid = $4 RETURNING *',
        [name, colour, req.params.course_uuid, req.user.user_uuid]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Course not found' });
    res.json({ course: rows[0] });
});

// DELETE /api/courses/:course_uuid
router.delete('/:course_uuid', async (req, res) => {
    const { rows } = await pool.query(
        'DELETE FROM courses WHERE course_uuid = $1 AND user_uuid = $2',
        [req.params.course_uuid, req.user.user_uuid]
    );
    res.status(204).send();
});

module.exports = router;