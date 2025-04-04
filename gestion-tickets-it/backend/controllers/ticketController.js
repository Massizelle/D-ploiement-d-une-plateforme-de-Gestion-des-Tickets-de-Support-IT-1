const Ticket = require('../models/Ticket');

const ticketController = {
    // Obtenir tous les tickets (filtré selon le rôle)
    getAllTickets: async (req, res) => {
        try {
            const tickets = await Ticket.getByUser(req.user.id, req.user.role);
            res.json(tickets);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Obtenir un ticket par ID
    getTicketById: async (req, res) => {
        try {
            const ticket = await Ticket.getById(req.params.id);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket non trouvé' });
            }
            
            // Vérifier l'accès au ticket
            if (
                req.user.role !== 'Admin' &&
                ticket.id_employe !== req.user.id &&
                (req.user.role !== 'Technicien' || (ticket.id_technicien !== req.user.id && ticket.id_technicien !== null))
            ) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            // Récupérer les commentaires
            const comments = await Ticket.getComments(req.params.id);
            
            res.json({ ticket, comments });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Créer un nouveau ticket
    createTicket: async (req, res) => {
        try {
            const { titre, description, priorite } = req.body;
            
            const ticket = await Ticket.create({
                titre,
                description,
                priorite,
                id_employe: req.user.id
            });
            
            res.status(201).json(ticket);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Mettre à jour un ticket
    updateTicket: async (req, res) => {
        try {
            const ticketId = req.params.id;
            
            // Vérifier si le ticket existe
            const existingTicket = await Ticket.getById(ticketId);
            if (!existingTicket) {
                return res.status(404).json({ message: 'Ticket non trouvé' });
            }
            
            // Vérifier les autorisations
            if (req.user.role === 'Employé' && existingTicket.id_employe !== req.user.id) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            if (
                req.user.role === 'Technicien' && 
                existingTicket.id_technicien !== req.user.id && 
                existingTicket.id_technicien !== null
            ) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            // Préparer les données de mise à jour
            const updateData = {};
            
            // Tous les utilisateurs peuvent mettre à jour ces champs
            if (req.body.titre) updateData.titre = req.body.titre;
            if (req.body.description) updateData.description = req.body.description;
            if (req.body.priorite) updateData.priorite = req.body.priorite;
            
            // Seuls les techniciens et admins peuvent mettre à jour le statut
            if ((req.user.role === 'Technicien' || req.user.role === 'Admin') && req.body.statut) {
                updateData.statut = req.body.statut;
            }
            
            // Seuls les admins peuvent assigner des techniciens
            if (req.user.role === 'Admin' && req.body.id_technicien) {
                updateData.id_technicien = req.body.id_technicien;
            }
            
            // Si un technicien prend le ticket non assigné
            if (
                req.user.role === 'Technicien' && 
                existingTicket.id_technicien === null
            ) {
                updateData.id_technicien = req.user.id;
            }
            
            // Mettre à jour le ticket
            const updatedTicket = await Ticket.update(ticketId, updateData);
            
            if (!updatedTicket) {
                return res.status(400).json({ message: 'Aucune mise à jour effectuée' });
            }
            
            res.json(updatedTicket);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Ajouter un commentaire à un ticket
    addComment: async (req, res) => {
        try {
            const { id_ticket, contenu } = req.body;
            
            // Vérifier si le ticket existe
            const ticket = await Ticket.getById(id_ticket);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket non trouvé' });
            }
            
            // Vérifier l'accès au ticket
            if (
                req.user.role !== 'Admin' &&
                ticket.id_employe !== req.user.id &&
                (req.user.role !== 'Technicien' || (ticket.id_technicien !== req.user.id && ticket.id_technicien !== null))
            ) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            // Ajouter le commentaire
            const comment = await Ticket.addComment({
                contenu,
                id_ticket,
                id_utilisateur: req.user.id
            });
            
            res.status(201).json(comment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Obtenir les statistiques du tableau de bord (admin seulement)
    getDashboardStats: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est admin
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            const stats = await Ticket.getDashboardStats();
            res.json(stats);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = ticketController;