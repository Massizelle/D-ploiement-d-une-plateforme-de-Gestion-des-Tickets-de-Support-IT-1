const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');  // Ajustez le chemin selon votre structure

// Route pour récupérer tous les utilisateurs
router.get('/users', userController.getAllUsers);

router.get('/users/:id', userController.getUser);

router.get('/users/technicians', userController.getAllTechnicians);

router.get('/users/employees', userController.getAllEmployees);

router.get('/users/admins', userController.getAllAdmins);

// Route pour ajouter un utilisateur
router.post('/users', userController.createUser);

// Route pour modifier un utilisateur
router.put('/users/:id', userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/users/:id', userController.deleteUser);

module.exports = router;