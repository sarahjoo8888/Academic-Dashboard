const router = require('express').Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/hobbies
router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT * FROM hobbies WHERE user_uuid = $1 ORDER BY name',
        [req.user.user_uuid]
    );
    res.json(rows);
});

// POST /api/hobbies
router.post('/', async (req, res) => {
  const { name, days_of_week, days_of_month } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await pool.query(
    `INSERT INTO hobbies (user_uuid, name, days_of_week, days_of_month)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.user.user_uuid, name, JSON.stringify(days_of_week || []), JSON.stringify(days_of_month || [])]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/hobbies/:hobby_uuid
router.patch('/:hobby_uuid', async (req, res) => {
  const { name, days_of_week, days_of_month } = req.body;
  const { rows } = await pool.query(
    `UPDATE hobbies SET
       name          = COALESCE($1, name),
       days_of_week  = COALESCE($2, days_of_week),
       days_of_month = COALESCE($3, days_of_month)
     WHERE hobby_uuid = $4 AND user_uuid = $5
     RETURNING *`,
    [name, days_of_week ? JSON.stringify(days_of_week) : null,
     days_of_month ? JSON.stringify(days_of_month) : null,
     req.params.hobby_uuid, req.user.user_uuid]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Hobby not found' });
  res.json(rows[0]);
});

// DELETE /api/hobbies/:hobby_uuid
router.delete('/:hobby_uuid', async (req, res) => {
  await pool.query(
    'DELETE FROM hobbies WHERE hobby_uuid = $1 AND user_uuid = $2',
    [req.params.hobby_uuid, req.user.user_uuid]
  );
  res.status(204).send();
});

// POST /api/hobbies/:hobby_uuid/complete  — mark today as done
router.post('/:hobby_uuid/complete', async (req, res) => {
  const { completed_date } = req.body; // optional, defaults to today
  try {
    const { rows } = await pool.query(
      `INSERT INTO hobby_completions (hobby_uuid, user_uuid, completed_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (hobby_uuid, completed_date) DO NOTHING
       RETURNING *`,
      [req.params.hobby_uuid, req.user.user_uuid, completed_date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(rows[0] || { message: 'Already completed today' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/hobbies/:hobby_uuid/complete — uncheck today
router.delete('/:hobby_uuid/complete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  await pool.query(
    'DELETE FROM hobby_completions WHERE hobby_uuid = $1 AND user_uuid = $2 AND completed_date = $3',
    [req.params.hobby_uuid, req.user.user_uuid, today]
  );
  res.status(204).send();
});

// GET /api/hobbies/:hobby_uuid/completions — fetch completion history
router.get('/:hobby_uuid/completions', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM hobby_completions WHERE hobby_uuid = $1 AND user_uuid = $2 ORDER BY completed_date DESC',
    [req.params.hobby_uuid, req.user.user_uuid]
  );
  res.json(rows);
});

module.exports = router
