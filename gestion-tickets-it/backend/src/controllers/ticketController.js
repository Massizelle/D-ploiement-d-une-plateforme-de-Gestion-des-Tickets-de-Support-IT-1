const db = require('./../db');

// Récupérer tous les tickets
const getAllTickets = async (req, res) => {
  try {
    console.log('Tentative de récupération des tickets...');
    const [rows] = await db.execute('SELECT * FROM tickets');
    console.log('Tickets récupérés:', rows);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des tickets:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets', error: err });
  }
};

// Récupérer un ticket


const getTicket = async (req, res) => {
    const { id } = req.params;
  
    try {
      const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Ticket non trouvé' });
      }
      res.status(200).json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la récupération du ticket', error: err });
    }
  };


// Créer un ticket
const createTicket = async (req, res) => {
    const { titre, description, statut, priorite, date_creation } = req.body;
  
    // Définir le statut par défaut à "ouvert" si non fourni
    const finalStatut = statut || 'ouvert';
  
    // Définir la date de création à la date actuelle si non fournie
    const finalDateCreation = date_creation || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  
    if (!titre || !description || !priorite) {
      return res.status(400).json({ message: 'Les champs titre, description, priorite sont obligatoires' });
    }
  
    try {
      const [result] = await db.execute(
        'INSERT INTO tickets (titre, description, statut, priorite, date_creation) VALUES (?, ?, ?, ?, ?)',
        [titre, description, finalStatut, priorite, finalDateCreation]
      );
      res.status(201).json({ message: 'Ticket créé', ticketId: result.insertId });
    } catch (err) {
      res.status(500).json({ message: 'Erreur lors de la création du ticket', error: err });
    }
  };
  

  

// Modifier un ticket
const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { titre, description, statut, priorite, date_creation } = req.body;

  if (!titre && !description && !statut && !priorite && !date_creation) {
    return res.status(400).json({ message: 'Il faut au moins un champ à modifier (titre, description, statut, priorite, date_creation)' });
  }

  let updateQuery = 'UPDATE tickets SET ';
  const values = [];
  if (titre) {
    updateQuery += 'titre = ?, ';
    values.push(titre);
  }
  if (description) {
    updateQuery += 'description = ?, ';
    values.push(description);
  }
  if (statut) {
    updateQuery += 'statut = ?, ';
    values.push(statut);
  }
  if (priorite) {
    updateQuery += 'priorite = ?, ';
    values.push(priorite);
  }
  if (date_creation) {
    updateQuery += 'date_creation = ?, ';
    values.push(date_creation);
  }

  // Retirer la virgule finale
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ' WHERE id = ?';
  values.push(id);

  try {
    const [result] = await db.execute(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    res.status(200).json({ message: 'Ticket modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la modification du ticket', error: err });
  }
};

// Supprimer un ticket
const deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM tickets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    res.status(200).json({ message: 'Ticket supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression du ticket', error: err });
  }
};

module.exports = { getAllTickets, getTicket, createTicket, updateTicket, deleteTicket };
