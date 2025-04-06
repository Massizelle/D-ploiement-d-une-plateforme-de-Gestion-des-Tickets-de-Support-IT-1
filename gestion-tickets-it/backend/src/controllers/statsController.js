const db = require('./../db');

// Nombre de tickets ouverts / résolus
const getTicketStats = async (req, res) => {
    try {
      // Statistiques par statut
      const [statusRows] = await db.execute(`
        SELECT 
          SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END) AS total_ouverts,
          SUM(CASE WHEN statut = 'résolu' THEN 1 ELSE 0 END) AS total_resolus,
          SUM(CASE WHEN statut = 'en cours' THEN 1 ELSE 0 END) AS total_en_cours,
          SUM(CASE WHEN statut = 'fermé' THEN 1 ELSE 0 END) AS total_fermes
        FROM tickets
      `);
  
      // Temps moyen par technicien
      const [timeRows] = await db.execute(`
        SELECT 
          id_technicien,
          ROUND(AVG(TIMESTAMPDIFF(HOUR, date_creation, date_mise_a_jour)), 2) AS temps_moyen_heures
        FROM tickets
        WHERE statut = 'résolu' AND id_technicien IS NOT NULL
        GROUP BY id_technicien
      `);
  
      res.status(200).json({
        stats_par_statut: statusRows[0],
        temps_moyen_par_technicien: timeRows
      });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de tickets', error: err });
    }
  };
  

// Liste des tickets critiques
const getCriticalTickets = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM tickets WHERE priorite = 'haute'
    `);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets critiques', error: err });
  }
};

module.exports = {
  getTicketStats,
  getCriticalTickets
};
