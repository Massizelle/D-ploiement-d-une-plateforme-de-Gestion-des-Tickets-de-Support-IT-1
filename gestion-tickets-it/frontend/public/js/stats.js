// Gestion des statistiques
const statsModule = {
    // Référence aux éléments des graphiques
    charts: {
        priorityChart: null,
        monthlyTicketsChart: null,
        techResolutionChart: null,
        statusChart: null
    },

    // Référence aux éléments DOM
    elements: {
        priorityChartCanvas: document.getElementById('priority-chart'),
        monthlyTicketsChartCanvas: document.getElementById('monthly-tickets-chart'),
        techResolutionChartCanvas: document.getElementById('tech-resolution-chart'),
        statusChartCanvas: document.getElementById('status-chart'),
        techPerformanceList: document.getElementById('tech-performance-list'),
        pendingTickets: document.getElementById('pending-tickets'),
        inProgressTickets: document.getElementById('in-progress-tickets'),
        resolvedTickets: document.getElementById('resolved-tickets'),
        avgTime: document.getElementById('avg-time'),
        recentTickets: document.getElementById('recent-tickets')
    },

    // Initialisation du module
    init: function() {
        // Charger les statistiques du tableau de bord si on est sur cette page
        if (document.getElementById('dashboard-section') && 
            !document.getElementById('dashboard-section').classList.contains('hide')) {
            this.loadDashboardStats();
        }

        // Charger les statistiques détaillées si on est sur la page stats
        if (document.getElementById('stats-section') && 
            !document.getElementById('stats-section').classList.contains('hide')) {
            this.loadDetailedStats();
        }
    },

    // Charger les statistiques pour le tableau de bord
    loadDashboardStats: async function() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/statistiques/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des statistiques');
            }

            const stats = await response.json();
            this.updateDashboard(stats);
            this.createPriorityChart(stats.ticketsByPriority);
            this.displayRecentTickets(stats.recentTickets);
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des statistiques', 'error');
        }
    },

    // Mettre à jour les statistiques du tableau de bord
    updateDashboard: function(stats) {
        if (this.elements.pendingTickets) {
            this.elements.pendingTickets.textContent = stats.openTickets || 0;
        }
        if (this.elements.inProgressTickets) {
            this.elements.inProgressTickets.textContent = stats.inProgressTickets || 0;
        }
        if (this.elements.resolvedTickets) {
            this.elements.resolvedTickets.textContent = stats.resolvedTickets || 0;
        }
        if (this.elements.avgTime) {
            this.elements.avgTime.textContent = `${stats.averageResolutionTime || 0}h`;
        }
    },

    // Afficher les tickets récents
    displayRecentTickets: function(tickets) {
        if (!this.elements.recentTickets) return;
        
        this.elements.recentTickets.innerHTML = '';
        
        if (!tickets || tickets.length === 0) {
            this.elements.recentTickets.innerHTML = '<p>Aucun ticket récent</p>';
            return;
        }
        
        tickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'recent-ticket';
            ticketElement.innerHTML = `
                <div class="ticket-header">
                    <span class="ticket-id">#${ticket.id}</span>
                    <span class="ticket-priority ${this.getPriorityClass(ticket.priorite)}">${ticket.priorite}</span>
                </div>
                <div class="ticket-title">${ticket.titre}</div>
                <div class="ticket-meta">
                    <span class="ticket-status ${this.getStatusClass(ticket.statut)}">${ticket.statut}</span>
                    <span class="ticket-date">${new Date(ticket.date_creation).toLocaleDateString()}</span>
                </div>
            `;
            
            this.elements.recentTickets.appendChild(ticketElement);
            
            // Ajouter un événement pour ouvrir le détail du ticket
            ticketElement.addEventListener('click', () => {
                window.location.hash = `#ticket-${ticket.id}`;
            });
        });
    },

    // Créer le graphique des tickets par priorité
    createPriorityChart: function(data) {
        if (!this.elements.priorityChartCanvas) return;
        
        const ctx = this.elements.priorityChartCanvas.getContext('2d');
        
        // Détruire le graphique précédent s'il existe
        if (this.charts.priorityChart) {
            this.charts.priorityChart.destroy();
        }
        
        this.charts.priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#28a745', // Faible - Vert
                        '#ffc107', // Moyenne - Jaune
                        '#fd7e14', // Élevée - Orange
                        '#dc3545'  // Critique - Rouge
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    // Charger les statistiques détaillées pour la page statistiques
    loadDetailedStats: async function() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/statistiques/detaillees', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des statistiques détaillées');
            }

            const stats = await response.json();
            this.createMonthlyTicketsChart(stats.ticketsByMonth);
            this.createTechResolutionChart(stats.technicianPerformance);
            this.createStatusChart(stats.ticketsByStatus);
            this.displayTechPerformance(stats.technicianPerformance);
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des statistiques détaillées', 'error');
        }
    },

    // Créer le graphique des tickets par mois
    createMonthlyTicketsChart: function(data) {
        if (!this.elements.monthlyTicketsChartCanvas) return;
        
        const ctx = this.elements.monthlyTicketsChartCanvas.getContext('2d');
        
        // Détruire le graphique précédent s'il existe
        if (this.charts.monthlyTicketsChart) {
            this.charts.monthlyTicketsChart.destroy();
        }
        
        const months = Object.keys(data);
        const createdTickets = months.map(m => data[m].created || 0);
        const resolvedTickets = months.map(m => data[m].resolved || 0);
        
        this.charts.monthlyTicketsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Tickets créés',
                        data: createdTickets,
                        backgroundColor: '#007bff'
                    },
                    {
                        label: 'Tickets résolus',
                        data: resolvedTickets,
                        backgroundColor: '#28a745'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Créer le graphique du temps moyen de résolution par technicien
    createTechResolutionChart: function(data) {
        if (!this.elements.techResolutionChartCanvas) return;
        
        const ctx = this.elements.techResolutionChartCanvas.getContext('2d');
        
        // Détruire le graphique précédent s'il existe
        if (this.charts.techResolutionChart) {
            this.charts.techResolutionChart.destroy();
        }
        
        const technicianNames = data.map(t => t.nom);
        const avgResolutionTimes = data.map(t => t.tempsResolutionMoyen);
        
        this.charts.techResolutionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: technicianNames,
                datasets: [{
                    label: 'Temps moyen (heures)',
                    data: avgResolutionTimes,
                    backgroundColor: '#17a2b8'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Créer le graphique des tickets par statut
    createStatusChart: function(data) {
        if (!this.elements.statusChartCanvas) return;
        
        const ctx = this.elements.statusChartCanvas.getContext('2d');
        
        // Détruire le graphique précédent s'il existe
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }
        
        this.charts.statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#007bff', // Ouvert - Bleu
                        '#ffc107', // En cours - Jaune
                        '#28a745', // Résolu - Vert
                        '#6c757d'  // Fermé - Gris
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    },

    // Afficher les performances des techniciens
    displayTechPerformance: function(technicianData) {
        if (!this.elements.techPerformanceList) return;
        
        this.elements.techPerformanceList.innerHTML = '';
        
        technicianData.forEach(tech => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tech.nom}</td>
                <td>${tech.ticketsResolus}</td>
                <td>${tech.tempsResolutionMoyen.toFixed(1)}</td>
                <td>
                    <div class="satisfaction-rating">
                        ${this.generateStarRating(tech.satisfaction)}
                    </div>
                </td>
            `;
            
            this.elements.techPerformanceList.appendChild(row);
        });
    },

    // Générer une notation en étoiles pour la satisfaction
    generateStarRating: function(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Étoiles pleines
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        // Demi-étoile si nécessaire
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Étoiles vides
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    },

    // Obtenir la classe CSS pour le statut de ticket
    getStatusClass: function(status) {
        switch(status) {
            case 'Ouvert': return 'status-open';
            case 'En cours': return 'status-in-progress';
            case 'Résolu': return 'status-resolved';
            case 'Fermé': return 'status-closed';
            default: return '';
        }
    },

    // Obtenir la classe CSS pour la priorité de ticket
    getPriorityClass: function(priority) {
        switch(priority) {
            case 'Faible': return 'priority-low';
            case 'Moyenne': return 'priority-medium';
            case 'Élevée': return 'priority-high';
            case 'Critique': return 'priority-critical';
            default: return '';
        }
    }
};

// Initialiser le module quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    statsModule.init();
});