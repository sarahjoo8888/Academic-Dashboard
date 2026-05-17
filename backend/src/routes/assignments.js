const router = require('express').Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/assignments
router.get('/', async (req, res) => {
    const { status, course_uuid } = req.query;
    let query =
        'SELECT a.*, c.name AS course_colour FROM assignments a JOIN courses c USING (course_uuid) WHERE a.user_uuid = $1';
    const params = [req.user.user_uuid];

    if (status) {
        params.push(status);
        query += ` AND a.status = $${params.length}`;
    }
    if (course_uuid) {
        params.push(course_uuid);
        query += ` AND a.course_uuid = $${params.length}`;
    }
    query += ' ORDER BY a.due_date ASC NULLS LAST';

    const { rows } = await pool.query(query, params);
    res.json({ assignments: rows });
});

// POST /api/assignments
router.post('/', async (req, res) => {
    const { course_uuid, name, weight, grade, due_date, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const { rows } = await pool.query(
    `INSERT INTO assignments
        (user_uuid, course_uuid, name, weight, grade, due_date, status, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
    [req.user.user_uuid, course_uuid, name, weight, grade, due_date, status || 'upcoming', notes]
    );
    res.status(201).json(rows[0]);
});

// PATCH /api/assignments/:assignment_uuid
router.patch('/:assignment_uuid', async (req, res) => {
    const { course_uuid, name, weight, grade, due_date, status, notes } = req.body;
    const { rows } = await pool.query(
    `UPDATE assignments SET
        course_uuid = COALESCE($1, course_uuid),
        name        = COALESCE($2, name),
        weight      = COALESCE($3, weight),
        grade       = COALESCE($4, grade),
        due_date    = COALESCE($5, due_date),
        status      = COALESCE($6, status),
        notes       = COALESCE($7, notes)
        WHERE assignment_uuid = $8 AND user_uuid = $9
        RETURNING *`,
    [course_uuid, name, weight, grade, due_date, status, notes, req.params.id, req.user.user_uuid]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
});

// DELETE /api/assignments/:assignment_uuid
router.delete('/:assignment_uuid', async (req, res) => {
    const { rows } = await pool.query(
        'DELETE FROM assignments WHERE assignment_uuid = $1 AND user_uuid = $2',
        [req.params.id, req.user.user_uuid]
    );
    res.status(204).send();
});

module.exports = router;