const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// @route   POST api/comments
// @desc    Add a comment to a ticket
// @access  Private
router.post('/', auth, async (req, res) => {
  const { id_ticket, contenu } = req.body;

  try {
    // Check if ticket exists
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [id_ticket]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check if user has access to this ticket
    if (
      req.user.role !== 'Admin' &&
      ticket.id_employe !== req.user.id &&
      (req.user.role !== 'Technicien' || (ticket.id_technicien !== req.user.id && ticket.id_technicien !== null))
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Add comment
    const [result] = await pool.query(
      'INSERT INTO commentaires (contenu, id_ticket, id_utilisateur) VALUES (?, ?, ?)',
      [contenu, id_ticket, req.user.id]
    );

    const [newComment] = await pool.query(
      `SELECT c.*, u.nom as nom_utilisateur, u.role as role_utilisateur
       FROM commentaires c
       JOIN utilisateurs u ON c.id_utilisateur = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.json(newComment[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;