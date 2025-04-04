const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

router.get('/', ticketController.getAllTickets);
router.get('/stats/dashboard', ticketController.getDashboardStats);
router.get('/:id', ticketController.getTicketById);
router.post('/', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.post('/comment', ticketController.addComment);

module.exports = router;