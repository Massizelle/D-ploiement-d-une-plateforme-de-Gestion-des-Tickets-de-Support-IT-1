/**
 * Module d'authentification pour gérer la connexion et les sessions utilisateur
 */
const Auth = (() => {
    let currentUser = null;
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameElement = document.getElementById('user-name');
    
    /**
     * Initialise le module d'authentification
     */
    const init = () => {
        // Vérifier si l'utilisateur est déjà connecté
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUI();
        }
        
        // Gestionnaire pour le formulaire de connexion
        loginForm.addEventListener('submit', login);
        
        // Gestionnaire pour le bouton de déconnexion
        logoutBtn.addEventListener('click', logout);
        
        // Gestionnaire pour le bouton de connexion (affichage du formulaire)
        loginBtn.addEventListener('click', () => {
            showSection('login-section');
        });
    };
    
    /**
     * Gère la connexion de l'utilisateur
     * @param {Event} event - L'événement de soumission du formulaire
     */
    const login = async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await API.login({ email, password });
            
            // Sauvegarder le token et les informations utilisateur
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            currentUser = response.user;
            
            // Mettre à jour l'interface
            updateUI();
            
            // Afficher le tableau de bord
            showSection('dashboard-section');
            
            // Afficher une notification de succès
            showNotification('Connexion réussie', 'success');
            
            // Réinitialiser le formulaire
            loginForm.reset();
        } catch (error) {
            showNotification('Échec de la connexion: ' + error.message, 'error');
        }
    };
    
    /**
     * Gère la déconnexion de l'utilisateur
     */
    const logout = () => {
        // Supprimer les données d'authentification
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        currentUser = null;
        
        // Mettre à jour l'interface
        updateUI();
        
        // Rediriger vers la page de connexion
        showSection('login-section');
        
        // Afficher une notification
        showNotification('Vous avez été déconnecté', 'success');
    };
    
    /**
     * Met à jour l'interface utilisateur en fonction de l'état de connexion
     */
    const updateUI = () => {
        if (currentUser) {
            // Utilisateur connecté
            userNameElement.textContent = currentUser.nom;
            loginBtn.classList.add('hide');
            logoutBtn.classList.remove('hide');
            
            // Afficher/cacher les éléments en fonction du rôle
            document.querySelectorAll('.role-all').forEach(el => el.style.display = 'block');
            
            if (currentUser.role === 'Employé') {
                document.querySelectorAll('.role-employee').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-tech, .role-admin').forEach(el => el.style.display = 'none');
            } else if (currentUser.role === 'Technicien') {
                document.querySelectorAll('.role-tech').forEach(el => el.style.display = 'block');
                document.querySelectorAll('.role-employee, .role-admin').forEach(el => el.style.display = 'none');
            } else if (currentUser.role === 'Admin') {
                document.querySelectorAll('.role-employee, .role-tech, .role-admin').forEach(el => el.style.display = 'block');
            }
        } else {
            // Utilisateur déconnecté
            userNameElement.textContent = 'Non connecté';
            loginBtn.classList.remove('hide');
            logoutBtn.classList.add('hide');
            
            // Cacher tous les éléments spécifiques aux rôles
            document.querySelectorAll('.role-employee, .role-tech, .role-admin').forEach(el => el.style.display = 'none');
        }
    };
    
    /**
     * Vérifie si l'utilisateur est connecté
     * @returns {boolean} - True si connecté, false sinon
     */
    const isLoggedIn = () => {
        return currentUser !== null;
    };
    
    /**
     * Récupère l'utilisateur actuellement connecté
     * @returns {Object|null} - L'utilisateur connecté ou null
     */
    const getUser = () => {
        return currentUser;
    };
    
    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param {string} role - Le rôle à vérifier
     * @returns {boolean} - True si l'utilisateur a le rôle, false sinon
     */
    const hasRole = (role) => {
        if (!currentUser) return false;
        
        if (role === 'Admin') {
            return currentUser.role === 'Admin';
        } else if (role === 'Technicien') {
            return currentUser.role === 'Technicien' || currentUser.role === 'Admin';
        } else if (role === 'Employé') {
            return true; // Tous les utilisateurs ont au moins les droits d'un employé
        }
        
        return false;
    };
    
    return {
        init,
        login,
        logout,
        isLoggedIn,
        getUser,
        hasRole
    };
})();