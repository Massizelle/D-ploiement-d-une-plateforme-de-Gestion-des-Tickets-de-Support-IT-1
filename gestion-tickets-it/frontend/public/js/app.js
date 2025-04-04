// Application principale
const app = {
    // État de l'application
    state: {
        currentSection: 'login-section',
        currentUser: null,
        currentTicketId: null,
        isLoggedIn: false
    },

    // Référence aux éléments DOM
    elements: {
        userSection: document.getElementById('user-section'),
        userName: document.getElementById('user-name'),
        loginBtn: document.getElementById('login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        sections: document.querySelectorAll('.section'),
        navLinks: document.querySelectorAll('nav a'),
        notification: document.getElementById('notification')
    },

    // Initialisation de l'application
    init: function() {
        this.checkAuthentication();
        this.attachEventListeners();
        this.handleNavigation();
    },

    // Vérifier si l'utilisateur est authentifié
    checkAuthentication: function() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            this.state.isLoggedIn = true;
            this.state.currentUser = user;
            this.updateUI();
            
            // Rediriger vers le tableau de bord si on est sur la page de login
            if (this.state.currentSection === 'login-section') {
                this.navigateTo('dashboard-section');
            }
        } else {
            this.navigateTo('login-section');
        }
    },

    // Attacher les écouteurs d'événements
    attachEventListeners: function() {
        // Événements de navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1) + '-section';
                this.navigateTo(targetSection);
            });
        });

        // Événement de connexion
        if (document.getElementById('login-form')) {
            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Événement de déconnexion
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Gérer les événements de hashchange pour la navigation avec le bouton retour
        window.addEventListener('hashchange', () => {
            this.handleNavigation();
        });
    },

    // Gérer la navigation basée sur le hash de l'URL
    handleNavigation: function() {
        const hash = window.location.hash.substring(1);
        
        // Si on a un hash qui correspond à un ticket (ex: #ticket-123)
        if (hash.startsWith('ticket-')) {
            const ticketId = hash.split('-')[1];
            this.state.currentTicketId = ticketId;
            this.navigateTo('ticket-detail-section');
            ticketsModule.loadTicketDetails(ticketId);
        } 
        // Si on a un hash qui correspond à une section
        else if (hash && document.getElementById(hash + '-section')) {
            this.navigateTo(hash + '-section');
        }
        // Si on n'a pas de hash et qu'on est connecté
        else if (this.state.isLoggedIn && !hash) {
            this.navigateTo('dashboard-section');
        }
        // Si on n'est pas connecté
        else if (!this.state.isLoggedIn) {
            this.navigateTo('login-section');
        }
    },

    // Se connecter
    login: async function() {
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('Erreur d\'authentification');
            }
            
            const data = await response.json();
            
            // Stocker le token et les informations utilisateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            this.state.isLoggedIn = true;
            this.state.currentUser = data.user;
            
            this.updateUI();
            this.navigateTo('dashboard-section');
            showNotification('Connexion réussie', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur d\'authentification', 'error');
        }
    },

    // Se déconnecter
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.state.isLoggedIn = false;
        this.state.currentUser = null;
        
        this.updateUI();
        this.navigateTo('login-section');
        showNotification('Déconnexion réussie', 'success');
    },

    // Mettre à jour l'interface utilisateur en fonction de l'état de connexion
    updateUI: function() {
        if (this.state.isLoggedIn) {
            this.elements.userName.textContent = this.state.currentUser.nom;
            this.elements.loginBtn.classList.add('hide');
            this.elements.logoutBtn.classList.remove('hide');
            
            // Afficher/masquer les éléments en fonction du rôle
            document.querySelectorAll('.role-all').forEach(el => el.style.display = 'block');
            
            if (this.state.currentUser.role === 'Admin') {
                document.querySelectorAll('.role-admin').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-tech').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-employee').forEach(el => el.style.display = 'block');
            } else if (this.state.currentUser.role === 'Technicien') {
                document.querySelectorAll('.role-admin').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.role-tech').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-employee').forEach(el => el.style.display = 'none');
            } else { // Employé
                document.querySelectorAll('.role-admin').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.role-tech').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.role-employee').forEach(el => el.style.display = 'block');
            }
        } else {
            this.elements.userName.textContent = 'Non connecté';
            this.elements.loginBtn.classList.remove('hide');
            this.elements.logoutBtn.classList.add('hide');
            
            // Masquer tous les éléments spécifiques aux rôles
            document.querySelectorAll('.role-all, .role-admin, .role-tech, .role-employee').forEach(el => {
                el.style.display = 'none';
            });
        }
    },

    // Naviguer vers une section
    navigateTo: function(sectionId) {
        // Masquer toutes les sections
        this.elements.sections.forEach(section => {
            section.classList.add('hide');
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hide');
            this.state.currentSection = sectionId;
            
            // Mettre à jour le hash de l'URL
            const baseId = sectionId.replace('-section', '');
            if (baseId !== 'login' && baseId !== 'ticket-detail') {
                window.location.hash = baseId;
            }
            
            // Mettre à jour la navigation active
            this.elements.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + baseId) {
                    link.classList.add('active');
                }
            });
            
            // Initialiser les modules spécifiques à la section
            if (sectionId === 'dashboard-section') {
                statsModule.init();
            } else if (sectionId === 'tickets-section') {
                ticketsModule.loadTickets();
            } else if (sectionId === 'users-section') {
                usersModule.loadUsers();
            } else if (sectionId === 'stats-section') {
                statsModule.loadDetailedStats();
            }
        }
    }
};

// Afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hide');
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
        notification.classList.add('hide');
    }, 3000);
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});