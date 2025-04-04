// Gestion des utilisateurs
const usersModule = {
    // Référence aux éléments DOM
    elements: {
        usersList: document.getElementById('users-list'),
        addUserBtn: document.getElementById('add-user-btn'),
        addUserModal: document.getElementById('add-user-modal'),
        addUserForm: document.getElementById('add-user-form'),
        closeModalBtns: document.querySelectorAll('.modal .close'),
    },

    // Initialisation du module
    init: function() {
        if (this.elements.addUserBtn) {
            this.elements.addUserBtn.addEventListener('click', () => {
                this.showAddUserModal();
            });
        }

        if (this.elements.addUserForm) {
            this.elements.addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addUser();
            });
        }

        this.elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hide');
                });
            });
        });

        // Charger la liste des utilisateurs si on est sur la page utilisateurs
        if (this.elements.usersList) {
            this.loadUsers();
        }
    },

    // Charger la liste des utilisateurs depuis l'API
    loadUsers: async function() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/utilisateurs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des utilisateurs');
            }

            const users = await response.json();
            this.renderUsers(users);
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des utilisateurs', 'error');
        }
    },

    // Afficher les utilisateurs dans le tableau
    renderUsers: function(users) {
        if (!this.elements.usersList) return;
        
        this.elements.usersList.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nom}</td>
                <td>${user.email}</td>
                <td><span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span></td>
                <td>${new Date(user.date_inscription).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            this.elements.usersList.appendChild(row);
            
            // Ajouter un événement au bouton de suppression
            row.querySelector('.delete-user').addEventListener('click', (e) => {
                const userId = e.target.closest('.delete-user').dataset.id;
                if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                    this.deleteUser(userId);
                }
            });
        });
    },

    // Déterminer la classe CSS pour le badge du rôle
    getRoleBadgeClass: function(role) {
        switch(role) {
            case 'Admin': return 'badge-danger';
            case 'Technicien': return 'badge-warning';
            case 'Employé': return 'badge-primary';
            default: return 'badge-secondary';
        }
    },

    // Afficher la modal d'ajout d'utilisateur
    showAddUserModal: function() {
        this.elements.addUserModal.classList.remove('hide');
    },

    // Ajouter un nouvel utilisateur
    addUser: async function() {
        try {
            const formData = new FormData(this.elements.addUserForm);
            const userData = {
                nom: formData.get('nom'),
                email: formData.get('email'),
                mot_de_passe: formData.get('mot_de_passe'),
                role: formData.get('role')
            };

            const token = localStorage.getItem('token');
            const response = await fetch('/api/utilisateurs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création de l\'utilisateur');
            }

            showNotification('Utilisateur créé avec succès', 'success');
            this.elements.addUserModal.classList.add('hide');
            this.elements.addUserForm.reset();
            this.loadUsers(); // Recharger la liste des utilisateurs
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la création de l\'utilisateur', 'error');
        }
    },

    // Supprimer un utilisateur
    deleteUser: async function(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/utilisateurs/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'utilisateur');
            }

            showNotification('Utilisateur supprimé avec succès', 'success');
            this.loadUsers(); // Recharger la liste des utilisateurs
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression de l\'utilisateur', 'error');
        }
    }
};

// Initialiser le module quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    usersModule.init();
});