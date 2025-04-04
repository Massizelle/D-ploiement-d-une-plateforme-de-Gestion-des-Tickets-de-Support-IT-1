const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Récupérer tous les utilisateurs
    static async getAll() {
        try {
            const [rows] = await pool.query(
                'SELECT id, nom, email, role, date_inscription FROM utilisateurs'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Récupérer un utilisateur par ID
    static async getById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT id, nom, email, role, date_inscription FROM utilisateurs WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Récupérer un utilisateur par email
    static async getByEmail(email) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM utilisateurs WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Créer un nouvel utilisateur
    static async create(userData) {
        try {
            const { nom, email, password, role } = userData;
            
            // Hashage du mot de passe
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const [result] = await pool.query(
                'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
                [nom, email, hashedPassword, role]
            );
            
            return { id: result.insertId, nom, email, role };
        } catch (error) {
            throw error;
        }
    }

    // Mettre à jour un utilisateur
    static async update(id, userData) {
        try {
            const { nom, email, role } = userData;
            
            const [result] = await pool.query(
                'UPDATE utilisateurs SET nom = ?, email = ?, role = ? WHERE id = ?',
                [nom, email, role, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Supprimer un utilisateur
    static async delete(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM utilisateurs WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;