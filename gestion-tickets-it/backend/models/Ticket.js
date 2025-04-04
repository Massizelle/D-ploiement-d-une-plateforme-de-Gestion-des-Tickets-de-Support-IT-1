const pool = require('../config/db');

class Ticket {
    // Récupérer tous les tickets
    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
                FROM tickets t
                JOIN utilisateurs u1 ON t.id_employe = u1.id
                LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
                ORDER BY t.date_creation DESC
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Récupérer les tickets par utilisateur
    static async getByUser(userId, role) {
        try {
            let query;
            let params = [];
            
            if (role === 'Admin') {
                return await this.getAll();
            } else if (role === 'Technicien') {
                query = `
                    SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
                    FROM tickets t
                    JOIN utilisateurs u1 ON t.id_employe = u1.id
                    LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
                    WHERE t.id_technicien = ? OR t.id_technicien IS NULL
                    ORDER BY t.date_creation DESC
                `;
                params = [userId];
            } else {
                query = `
                    SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
                    FROM tickets t
                    JOIN utilisateurs u1 ON t.id_employe = u1.id
                    LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
                    WHERE t.id_employe = ?
                    ORDER BY t.date_creation DESC
                `;
                params = [userId];
            }
            
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Récupérer un ticket par ID
    static async getById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT t.*, u1.nom as employe_nom, u2.nom as technicien_nom
                FROM tickets t
                JOIN utilisateurs u1 ON t.id_employe = u1.id
                LEFT JOIN utilisateurs u2 ON t.id_technicien = u2.id
                WHERE t.id = ?
            `, [id]);
            
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Créer un nouveau ticket
    static async create(ticketData) {
        try {
            const { titre, description, priorite, id_employe } = ticketData;
            
            const [result] = await pool.query(
                'INSERT INTO tickets (titre, description, priorite, id_employe) VALUES (?, ?, ?, ?)',
                [titre, description, priorite, id_employe]
            );
            
            return this.getById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Mettre à jour un ticket
    static async update(id, ticketData) {
        try {
            // Construire la requête dynamiquement
            const updateFields = {};
            
            if (ticketData.titre) updateFields.titre = ticketData.titre;
            if (ticketData.description) updateFields.description = ticketData.description;
            if (ticketData.statut) updateFields.statut = ticketData.statut;
            if (ticketData.priorite) updateFields.priorite = ticketData.priorite;
            if (ticketData.id_technicien) updateFields.id_technicien = ticketData.id_technicien;
            
            // Convertir l'objet en SQL
            const fields = Object.keys(updateFields)
                .map(key => `${key} = ?`)
                .join(', ');
            
            if (!fields) {
                return null; // Rien à mettre à jour
            }
            
            const values = Object.values(updateFields);
            values.push(id);
            
            const [result] = await pool.query(
                `UPDATE tickets SET ${fields} WHERE id = ?`,
                values
            );
            
            if (result.affectedRows > 0) {
                return this.getById(id);
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    // Récupérer les commentaires d'un ticket
    static async getComments(ticketId) {
        try {
            const [rows] = await pool.query(`
                SELECT c.*, u.nom as nom_utilisateur, u.role as role_utilisateur
                FROM commentaires c
                JOIN utilisateurs u ON c.id_utilisateur = u.id
                WHERE c.id_ticket = ?
                ORDER BY c.date_creation ASC
            `, [ticketId]);
            
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Ajouter un commentaire à un ticket
    static async addComment(commentData) {
        try {
            const { contenu, id_ticket, id_utilisateur } = commentData;
            
            const [result] = await pool.query(
                'INSERT INTO commentaires (contenu, id_ticket, id_utilisateur) VALUES (?, ?, ?)',
                [contenu, id_ticket, id_utilisateur]
            );
            
            const [rows] = await pool.query(`
                SELECT c.*, u.nom as nom_utilisateur, u.role as role_utilisateur
                FROM commentaires c
                JOIN utilisateurs u ON c.id_utilisateur = u.id
                WHERE c.id = ?
            `, [result.insertId]);
            
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Obtenir des statistiques pour le tableau de bord
    static async getDashboardStats() {
        try {
            // Tickets par statut
            const [ticketsByStatus] = await pool.query(
                `SELECT statut, COUNT(*) as count
                FROM tickets
                GROUP BY statut`
            );
            
            // Tickets par priorité
            const [ticketsByPriority] = await pool.query(
                `SELECT priorite, COUNT(*) as count
                FROM tickets
                GROUP BY priorite`
            );
            
            // Temps moyen de résolution par technicien
            const [avgResolutionTime] = await pool.query(
                `SELECT 
                    u.id, u.nom,
                    AVG(TIMESTAMPDIFF(HOUR, t.date_creation, t.date_mise_a_jour)) as avg_resolution_time
                FROM tickets t
                JOIN utilisateurs u ON t.id_technicien = u.id
                WHERE t.statut = 'Résolu' OR t.statut = 'Fermé'
                GROUP BY t.id_technicien`
            );
            
            return {
                ticketsByStatus,
                ticketsByPriority,
                avgResolutionTime
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Ticket;