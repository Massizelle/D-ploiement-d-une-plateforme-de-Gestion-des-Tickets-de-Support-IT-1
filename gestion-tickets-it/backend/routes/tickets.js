const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// @route   GET api/tickets
// @desc    Get all tickets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'Admin') {
      // Admins can see all tickets
      query = `
        SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
        FROM tickets t
        JOIN utilisateurs u1 ON t.id_employe = u1.id
        LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
        ORDER BY t.date_creation DESC
      `;
    } else if (req.user.role === 'Technicien') {
      // Techniciens can see tickets assigned to them or unassigned
      query = `
        SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
        FROM tickets t
        JOIN utilisateurs u1 ON t.id_employe = u1.id
        LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
        WHERE t.id_technicien = ? OR t.id_technicien IS NULL
        ORDER BY t.date_creation DESC
      `;
      params = [req.user.id];
    } else {
      // Employees can see only their tickets
      query = `
        SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
        FROM tickets t
        JOIN utilisateurs u1 ON t.id_employe = u1.id
        LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
        WHERE t.id_employe = ?
        ORDER BY t.date_creation DESC
      `;
      params = [req.user.id];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
       FROM tickets t
       JOIN utilisateurs u1 ON t.id_employe = u1.id
       LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const ticket = rows[0];

    // Check if user has access to this ticket
    if (
      req.user.role !== 'Admin' &&
      ticket.id_employe !== req.user.id &&
      (req.user.role !== 'Technicien' || (ticket.id_technicien !== req.user.id && ticket.id_technicien !== null))
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get comments for the ticket
    const [comments] = await pool.query(
      `SELECT c.*, u.nom as nom_utilisateur, u.role as role_utilisateur
       FROM commentaires c
       JOIN utilisateurs u ON c.id_utilisateur = u.id
       WHERE c.id_ticket = ?
       ORDER BY c.date_creation ASC`,
      [req.params.id]
    );

    res.json({ ticket, comments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tickets
// @desc    Create a ticket
// @access  Private
router.post('/', auth, async (req, res) => {
  const { titre, description, priorite } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO tickets (titre, description, priorite, id_employe) VALUES (?, ?, ?, ?)',
      [titre, description, priorite, req.user.id]
    );

    const [newTicket] = await pool.query(
      `SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
       FROM tickets t
       JOIN utilisateurs u1 ON t.id_employe = u1.id
       LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.json(newTicket[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tickets/:id
// @desc    Update a ticket
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { titre, description, statut, priorite, id_technicien } = req.body;

  try {
    // Check if ticket exists
    const [rows] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    const ticket = rows[0];

    // Check permissions
    if (req.user.role === 'Employé' && ticket.id_employe !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (
      req.user.role === 'Technicien' && 
      ticket.id_technicien !== req.user.id && 
      ticket.id_technicien !== null
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Build update object
    const updateFields = {};
    if (titre) updateFields.titre = titre;
    if (description) updateFields.description = description;
    
    // Only technicians and admins can update status
    if ((req.user.role === 'Technicien' || req.user.role === 'Admin') && statut) {
      updateFields.statut = statut;
    }
    
    if (priorite) updateFields.priorite = priorite;
    
    // Only admins can assign technicians
    if (req.user.role === 'Admin' && id_technicien) {
      updateFields.id_technicien = id_technicien;
    }

    // If the technician is taking the ticket
    if (
      req.user.role === 'Technicien' && 
      ticket.id_technicien === null && 
      !id_technicien
    ) {
      updateFields.id_technicien = req.user.id;
    }

    // Convert object to SQL
    const fields = Object.keys(updateFields)
      .map(key => `${key} = ?`)
      .join(', ');
    
    if (fields === '') {
      return res.status(400).json({ msg: 'No fields to update' });
    }

    const values = Object.values(updateFields);
    values.push(req.params.id);

    await pool.query(
      `UPDATE tickets SET ${fields} WHERE id = ?`,
      values
    );

    const [updatedTicket] = await pool.query(
      `SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
       FROM tickets t
       JOIN utilisateurs u1 ON t.id_employe = u1.id
       LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    res.json(updatedTicket[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tickets/stats/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get total tickets by status
    const [ticketsByStatus] = await pool.query(
      `SELECT statut, COUNT(*) as count
       FROM tickets
       GROUP BY statut`
    );

    // Get tickets by priority
    const [ticketsByPriority] = await pool.query(
      `SELECT priorite, COUNT(*) as count
       FROM tickets
       GROUP BY priorite`
    );

    // Get average resolution time by technician
    const [avgResolutionTimeByTechnician] = await pool.query(
      `SELECT 
         u.id, u.nom,
         AVG(TIMESTAMPDIFF(HOUR, t.date_creation, t.date_mise_a_jour)) as avg_resolution_time
       FROM tickets t
       JOIN utilisateurs u ON t.id_technicien = u.id
       WHERE t.statut = 'Résolu' OR t.statut = 'Fermé'
       GROUP BY t.id_technicien`
    );

    res.json({
      ticketsByStatus,
      ticketsByPriority,
      avgResolutionTimeByTechnician
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;