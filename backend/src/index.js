const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const assignmentsRoutes = require('./routes/assignments');
const hobbiesRoutes = require('./routes/hobbies');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/hobbies', hobbiesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' })); 

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


