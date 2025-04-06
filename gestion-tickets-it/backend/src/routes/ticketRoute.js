const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');


router.get('/tickets', ticketController.getAllTickets);

// Route pour ajouter un ticket
router.post('/tickets', ticketController.createTicket);

// Route pour récupérer un ticket

router.get('/tickets/:id', ticketController.getTicket);

// Route pour modifier un ticket
router.put('/tickets/:id', ticketController.updateTicket);

// Route pour supprimer un ticket
router.delete('/tickets/:id', ticketController.deleteTicket);

module.exports = router;