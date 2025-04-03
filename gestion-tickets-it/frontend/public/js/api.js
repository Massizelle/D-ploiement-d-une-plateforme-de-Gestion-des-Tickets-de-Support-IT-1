/**
 * Module API pour gérer les communications avec le backend
 */
const API = (() => {
    const API_URL = 'http://localhost:3000/api'; // À ajuster selon votre configuration

    /**
     * Effectue une requête HTTP vers l'API
     * @param {string} endpoint - Point d'entrée API
     * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
     * @param {Object} data - Données à envoyer (pour POST/PUT)
     * @returns {Promise} - Promesse avec les données de réponse
     */
    const request = async (endpoint, method = 'GET', data = null) => {
        const url = `${API_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Ajouter le token d'authentification si disponible
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        // Ajouter le corps de la requête pour POST/PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Vérifier si la réponse est OK (status 200-299)
            if (!response.ok) {
                if (response.status === 401) {
                    // Non autorisé - probablement token expiré
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.reload();
                    return;
                }
                
                const error = await response.json();
                throw new Error(error.message || 'Une erreur est survenue');
            }

            // Retourner les données de la réponse
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    };

    return {
        // Authentification
        login: (credentials) => request('/auth/login', 'POST', credentials),
        
        // Tickets
        getTickets: (page = 1, filters = {}) => request(`/tickets?page=${page}&${new URLSearchParams(filters)}`),
        getTicket: (id) => request(`/tickets/${id}`),
        createTicket: (ticketData) => request('/tickets', 'POST', ticketData),
        updateTicket: (id, ticketData) => request(`/tickets/${id}`, 'PUT', ticketData),
        deleteTicket: (id) => request(`/tickets/${id}`, 'DELETE'),
        
        // Commentaires
        getComments: (ticketId) => request(`/tickets/${ticketId}/comments`),
        addComment: (ticketId, commentData) => request(`/tickets/${ticketId}/comments`, 'POST', commentData),
        
        // Gestion des statuts et assignations
        changeStatus: (ticketId, statusData) => request(`/tickets/${ticketId}/status`, 'PUT', statusData),
        assignTechnician: (ticketId, assignData) => request(`/tickets/${ticketId}/assign`, 'PUT', assignData),
        
        // Utilisateurs
        getUsers: () => request('/users'),
        getTechnicians: () => request('/users/technicians'),
        createUser: (userData) => request('/users', 'POST', userData),
        updateUser: (id, userData) => request(`/users/${id}`, 'PUT', userData),
        deleteUser: (id) => request(`/users/${id}`, 'DELETE'),
        
        // Statistiques
        getStatistics: () => request('/statistics'),
        getTechnicianStats: () => request('/statistics/technicians')
    };
})();