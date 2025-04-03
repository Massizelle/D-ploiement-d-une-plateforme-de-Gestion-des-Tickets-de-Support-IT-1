const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', async (req, res) => {
  const { nom, email, password, role } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user to database
    const [result] = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
      [nom, email, hashedPassword, role]
    );

    const userId = result.insertId;

    const payload = {
      user: {
        id: userId,
        role
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

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const [rows] = await pool.query(
      'SELECT id, nom, email, role, date_inscription FROM utilisateurs'
    );

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const [result] = await pool.query(
      'DELETE FROM utilisateurs WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;