/**
 * Module de gestion des tickets
 */
const TicketsManager = (() => {
    // Éléments DOM
    const ticketsTable = document.getElementById('tickets-table');
    const ticketsList = document.getElementById('tickets-list');
    const ticketsPagination = document.getElementById('tickets-pagination');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const searchInput = document.getElementById('search');
    const createTicketForm = document.getElementById('create-ticket-form');
    
    // Éléments pour le détail d'un ticket
    const ticketDetailSection = document.getElementById('ticket-detail-section');
    const detailTitle = document.getElementById('ticket-detail-title');
    const detailId = document.getElementById('detail-id');
    const detailStatus = document.getElementById('detail-status');
    const detailPriority = document.getElementById('detail-priority');
    const detailCreator = document.getElementById('detail-creator');
    const detailCreated = document.getElementById('detail-created');
    const detailUpdated = document.getElementById('detail-updated');
    const detailAssigned = document.getElementById('detail-assigned');
    const detailDescription = document.getElementById('detail-description');
    const commentsListElement = document.getElementById('comments-list');
    const addCommentForm = document.getElementById('add-comment-form');
    
    // Éléments des modales
    const statusModal = document.getElementById('status-modal');
    const changeStatusForm = document.getElementById('change-status-form');
    const newStatusSelect = document.getElementById('new-status');
    const assignModal = document.getElementById('assign-modal');
    const assignForm = document.getElementById('assign-form');
    const technicianSelect = document.getElementById('technician-select');
    
    // État de la pagination et des filtres
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};
    let currentTicketId = null;
    
    /**
     * Initialise le gestionnaire de tickets
     */
    const init = () => {
        // Initialiser les écouteurs d'événements pour les filtres
        statusFilter.addEventListener('change', applyFilters);
        priorityFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        
        // Écouteur pour le formulaire de création de ticket
        createTicketForm.addEventListener('submit', createTicket);
        
        // Écouteur pour le formulaire d'ajout de commentaire
        addCommentForm.addEventListener('submit', addComment);
        
        // Écouteurs pour les modales
        document.getElementById('change-status').addEventListener('click', openStatusModal);
        changeStatusForm.addEventListener('submit', updateTicketStatus);
        
        document.getElementById('assign-ticket').addEventListener('click', openAssignModal);
        assignForm.addEventListener('submit', assignTicketToTechnician);
        
        // Fermeture des modales
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hide');
                });
            });
        });
        
        // Bouton retour depuis le détail
        document.getElementById('back-to-tickets').addEventListener('click', () => {
            showSection('tickets-section');
        });
        
        // Charger les tickets si l'utilisateur est connecté
        if (Auth.isLoggedIn()) {
            loadTickets();
        }
    };
    
    /**
     * Charge les tickets depuis l'API
     */
    const loadTickets = async () => {
        try {
            const response = await API.getTickets(currentPage, currentFilters);
            
            // Mettre à jour les données de pagination
            currentPage = response.currentPage;
            totalPages = response.totalPages;
            
            // Afficher les tickets
            displayTickets(response.tickets);
            
            // Mettre à jour la pagination
            displayPagination();
            
        } catch (error) {
            showNotification('Erreur lors du chargement des tickets: ' + error.message, 'error');
        }
    };
    
    /**
     * Affiche les tickets dans le tableau
     * @param {Array} tickets - Liste des tickets à afficher
     */
    const displayTickets = (tickets) => {
        ticketsList.innerHTML = '';
        
        if (tickets.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" class="text-center">Aucun ticket trouvé</td>';
            ticketsList.appendChild(emptyRow);
            return;
        }
        
        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            
            // Formater le statut pour l'affichage (sans espaces)
            const statusClass = `status-${ticket.statut.replace(' ', '-')}`;
            
            row.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.titre}</td>
                <td><span class="status ${statusClass}">${ticket.statut}</span></td>
                <td><span class="priority priority-${ticket.priorite}">${ticket.priorite}</span></td>
                <td>${formatDate(ticket.date_creation)}</td>
                <td>${ticket.technicien_nom || 'Non assigné'}</td>
                <td>
                    <button class="btn btn-primary btn-sm view-ticket" data-id="${ticket.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    ${Auth.hasRole('Technicien') ? `
                        <button class="btn btn-warning btn-sm status-ticket" data-id="${ticket.id}">
                            <i class="fas fa-exchange-alt"></i> Statut
                        </button>
                    ` : ''}
                    ${Auth.hasRole('Admin') ? `
                        <button class="btn btn-danger btn-sm delete-ticket" data-id="${ticket.id}">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    ` : ''}
                </td>
            `;
            
            ticketsList.appendChild(row);
        });
        
        // Ajouter les écouteurs d'événements aux boutons d'action
        document.querySelectorAll('.view-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.closest('.view-ticket').dataset.id;
                loadTicketDetails(ticketId);
            });
        });
        
        document.querySelectorAll('.status-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.closest('.status-ticket').dataset.id;
                currentTicketId = ticketId;
                openStatusModal();
            });
        });

        document.querySelectorAll('.delete-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.closest('.delete-ticket').dataset.id;
                deleteTicket(ticketId);
            });
        });
    };

    /**
     * Affiche la pagination
     */
    const displayPagination = () => {
        ticketsPagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Bouton Précédent
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-secondary';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTickets();
            }
        });
        ticketsPagination.appendChild(prevBtn);

        // Numéros de page
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                loadTickets();
            });
            ticketsPagination.appendChild(pageBtn);
        }

        // Bouton Suivant
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-secondary';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTickets();
            }
        });
        ticketsPagination.appendChild(nextBtn);
    };

    /**
     * Applique les filtres et recharge les tickets
     */
    const applyFilters = () => {
        currentFilters = {
            statut: statusFilter.value !== 'all' ? statusFilter.value : null,
            priorite: priorityFilter.value !== 'all' ? priorityFilter.value : null,
            search: searchInput.value.trim() || null
        };
        currentPage = 1;
        loadTickets();
    };

    /**
     * Crée un nouveau ticket
     * @param {Event} e - Événement de soumission du formulaire
     */
    const createTicket = async (e) => {
        e.preventDefault();
        
        const formData = {
            titre: createTicketForm.titre.value,
            description: createTicketForm.description.value,
            priorite: createTicketForm.priorite.value,
            id_employe: Auth.getCurrentUser().id
        };

        try {
            const newTicket = await API.createTicket(formData);
            showNotification('Ticket créé avec succès!', 'success');
            createTicketForm.reset();
            loadTickets();
            showSection('tickets-section');
        } catch (error) {
            showNotification('Erreur lors de la création du ticket: ' + error.message, 'error');
        }
    };

    /**
     * Charge les détails d'un ticket
     * @param {number} ticketId - ID du ticket à charger
     */
    const loadTicketDetails = async (ticketId) => {
        try {
            const ticket = await API.getTicket(ticketId);
            currentTicketId = ticketId;
            
            // Afficher les informations du ticket
            detailTitle.textContent = ticket.titre;
            detailId.textContent = ticket.id;
            detailStatus.textContent = ticket.statut;
            detailStatus.className = `value status status-${ticket.statut.replace(' ', '-')}`;
            detailPriority.textContent = ticket.priorite;
            detailPriority.className = `value priority priority-${ticket.priorite}`;
            detailCreator.textContent = ticket.employe_nom;
            detailCreated.textContent = formatDateTime(ticket.date_creation);
            detailUpdated.textContent = formatDateTime(ticket.date_mise_a_jour);
            detailAssigned.textContent = ticket.technicien_nom || 'Non assigné';
            detailDescription.textContent = ticket.description;
            
            // Charger les commentaires
            await loadComments(ticketId);
            
            // Afficher la section de détail
            showSection('ticket-detail-section');
            
        } catch (error) {
            showNotification('Erreur lors du chargement du ticket: ' + error.message, 'error');
        }
    };

    /**
     * Charge les commentaires d'un ticket
     * @param {number} ticketId - ID du ticket
     */
    const loadComments = async (ticketId) => {
        try {
            const comments = await API.getComments(ticketId);
            commentsListElement.innerHTML = '';
            
            if (comments.length === 0) {
                commentsListElement.innerHTML = '<p class="text-muted">Aucun commentaire pour ce ticket</p>';
                return;
            }
            
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <strong>${comment.utilisateur_nom}</strong>
                        <span class="text-muted">${formatDateTime(comment.date_creation)}</span>
                    </div>
                    <div class="comment-content">${comment.contenu}</div>
                `;
                commentsListElement.appendChild(commentElement);
            });
            
        } catch (error) {
            showNotification('Erreur lors du chargement des commentaires: ' + error.message, 'error');
        }
    };

    /**
     * Ajoute un commentaire à un ticket
     * @param {Event} e - Événement de soumission du formulaire
     */
    const addComment = async (e) => {
        e.preventDefault();
        
        const content = addCommentForm.querySelector('textarea').value.trim();
        if (!content) return;
        
        try {
            await API.addComment(currentTicketId, {
                contenu: content,
                id_utilisateur: Auth.getCurrentUser().id
            });
            
            addCommentForm.reset();
            await loadComments(currentTicketId);
            showNotification('Commentaire ajouté avec succès!', 'success');
            
        } catch (error) {
            showNotification('Erreur lors de l\'ajout du commentaire: ' + error.message, 'error');
        }
    };

    /**
     * Ouvre la modale de changement de statut
     */
    const openStatusModal = () => {
        statusModal.classList.remove('hide');
    };

    /**
     * Met à jour le statut d'un ticket
     * @param {Event} e - Événement de soumission du formulaire
     */
    const updateTicketStatus = async (e) => {
        e.preventDefault();
        
        const newStatus = newStatusSelect.value;
        const comment = statusModal.querySelector('textarea').value.trim();
        
        try {
            await API.updateTicketStatus(currentTicketId, {
                statut: newStatus,
                commentaire: comment || null
            });
            
            statusModal.classList.add('hide');
            changeStatusForm.reset();
            await loadTicketDetails(currentTicketId);
            loadTickets(); // Rafraîchir la liste
            showNotification('Statut du ticket mis à jour!', 'success');
            
        } catch (error) {
            showNotification('Erreur lors de la mise à jour du statut: ' + error.message, 'error');
        }
    };

    /**
     * Ouvre la modale d'assignation
     */
    const openAssignModal = async () => {
        try {
            // Charger la liste des techniciens
            const technicians = await API.getTechnicians();
            technicianSelect.innerHTML = '<option value="">Sélectionnez un technicien</option>';
            
            technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.id;
                option.textContent = tech.nom;
                technicianSelect.appendChild(option);
            });
            
            assignModal.classList.remove('hide');
            
        } catch (error) {
            showNotification('Erreur lors du chargement des techniciens: ' + error.message, 'error');
        }
    };

    /**
     * Assigne un technicien à un ticket
     * @param {Event} e - Événement de soumission du formulaire
     */
    const assignTicketToTechnician = async (e) => {
        e.preventDefault();
        
        const technicianId = technicianSelect.value;
        if (!technicianId) return;
        
        const comment = assignModal.querySelector('textarea').value.trim();
        
        try {
            await API.assignTicket(currentTicketId, {
                id_technicien: technicianId,
                commentaire: comment || null
            });
            
            assignModal.classList.add('hide');
            assignForm.reset();
            await loadTicketDetails(currentTicketId);
            loadTickets(); // Rafraîchir la liste
            showNotification('Technicien assigné avec succès!', 'success');
            
        } catch (error) {
            showNotification('Erreur lors de l\'assignation: ' + error.message, 'error');
        }
    };

    /**
     * Supprime un ticket
     * @param {number} ticketId - ID du ticket à supprimer
     */
    const deleteTicket = async (ticketId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket?')) return;
        
        try {
            await API.deleteTicket(ticketId);
            showNotification('Ticket supprimé avec succès!', 'success');
            loadTickets();
            
        } catch (error) {
            showNotification('Erreur lors de la suppression du ticket: ' + error.message, 'error');
        }
    };

    /**
     * Fonction debounce pour limiter la fréquence d'appel
     */
    const debounce = (func, delay) => {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    };

    /**
     * Formate une date pour l'affichage
     */
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    /**
     * Formate une date et heure pour l'affichage
     */
    const formatDateTime = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    /**
     * Affiche une notification
     */
    const showNotification = (message, type = 'info') => {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hide');
        
        setTimeout(() => {
            notification.classList.add('hide');
        }, 5000);
    };

    /**
     * Affiche une section spécifique
     */
    const showSection = (sectionId) => {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hide');
        });
        document.getElementById(sectionId).classList.remove('hide');
    };

    // Exposer les méthodes publiques
    return {
        init,
        loadTickets
    };
})();

// Initialiser lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', TicketsManager.init);