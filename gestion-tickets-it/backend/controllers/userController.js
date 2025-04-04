const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Créer le secret JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

const userController = {
    // S'inscrire
    register: async (req, res) => {
        try {
            const { nom, email, password, role } = req.body;
            
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.getByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
            
            // Créer un nouvel utilisateur
            const user = await User.create({ nom, email, password, role });
            
            // Générer un token JWT
            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            res.status(201).json({
                token,
                user: {
                    id: user.id,
                    nom: user.nom,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Se connecter
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Vérifier si l'utilisateur existe
            const user = await User.getByEmail(email);
            if (!user) {
                return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
            }
            
            // Vérifier le mot de passe
            const isMatch = await bcrypt.compare(password, user.mot_de_passe);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
            }
            
            // Générer un token JWT
            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            res.json({
                token,
                user: {
                    id: user.id,
                    nom: user.nom,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Obtenir tous les utilisateurs (admin seulement)
    getAllUsers: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est admin
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            const users = await User.getAll();
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Obtenir un utilisateur par ID
    getUserById: async (req, res) => {
        try {
            const user = await User.getById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Mettre à jour un utilisateur
    updateUser: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est admin ou le propriétaire du compte
            if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id)) {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            const result = await User.update(req.params.id, req.body);
            if (!result) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json({ message: 'Utilisateur mis à jour avec succès' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },
    
    // Supprimer un utilisateur (admin seulement)
    deleteUser: async (req, res) => {
        try {
            // Vérifier si l'utilisateur est admin
            if (req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Accès refusé' });
            }
            
            const result = await User.delete(req.params.id);
            if (!result) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json({ message: 'Utilisateur supprimé avec succès' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = userController;