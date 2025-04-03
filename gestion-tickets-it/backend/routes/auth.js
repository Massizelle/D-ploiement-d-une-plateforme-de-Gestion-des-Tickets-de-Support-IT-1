const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, role FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mysecrettoken',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;