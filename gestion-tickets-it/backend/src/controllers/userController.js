const db = require('./../db');

// Récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
    try {
      console.log('Tentative de récupération des utilisateurs...');
      const [rows] = await db.execute('SELECT * FROM users');
      console.log('Utilisateurs récupérés:', rows);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: err });
    }
  };


  const getUser = async (req, res) => {
    try {
      const userId = req.params.id; // Récupère l'ID depuis les paramètres de l'URL
  
      console.log(`Tentative de récupération de l'utilisateur avec l'ID: ${userId}`);
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      console.log('Utilisateur récupéré:', rows[0]);
      res.status(200).json(rows[0]); // Renvoyer un seul utilisateur
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: err });
    }
  };
  




  const getAllTechnicians = async (req, res) => {
    try {
        console.log('Tentative de récupération des techniciens...');
        const [rows] = await db.execute('SELECT * FROM users WHERE role = "Technicien"');
        console.log('Techniciens récupérés:', rows);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des techniciens:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des techniciens', error: err });
    }
};

const getAllEmployees = async (req, res) => {
    try {
        console.log('Tentative de récupération des employés...');
        const [rows] = await db.execute('SELECT * FROM users WHERE role = "Employé"');
        console.log('Employés récupérés:', rows);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des employés:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des employés', error: err });
    }
};

const getAllAdmins = async (req, res) => {
    try {
        console.log('Tentative de récupération des admins...');
        const [rows] = await db.execute('SELECT * FROM users WHERE role = "Admin"');
        console.log('Admins récupérés:', rows);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des admins:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des admins', error: err });
    }
};





  

// Ajouter un utilisateur
const createUser = async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom || !email || !mot_de_passe || !role) {
    return res.status(400).json({ message: 'Les champs nom, email, mot_de_passe et role sont obligatoires' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO users (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)', 
      [nom, email, mot_de_passe, role]
    );
    res.status(201).json({ message: 'Utilisateur créé', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: err });
  }
};

// Modifier un utilisateur
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom && !email && !mot_de_passe && !role) {
    return res.status(400).json({ message: 'Il faut au moins un champ à modifier (nom, email, mot_de_passe, role)' });
  }

  let updateQuery = 'UPDATE users SET ';
  const values = [];
  if (nom) {
    updateQuery += 'nom = ?, ';
    values.push(nom);
  }
  if (email) {
    updateQuery += 'email = ?, ';
    values.push(email);
  }
  if (mot_de_passe) {
    updateQuery += 'mot_de_passe = ?, ';
    values.push(mot_de_passe);
  }
  if (role) {
    updateQuery += 'role = ?, ';
    values.push(role);
  }

  // Supprimer la virgule finale
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ' WHERE id = ?';
  values.push(id);

  try {
    const [result] = await db.execute(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la modification de l\'utilisateur', error: err });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: err });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, getAllAdmins, getAllEmployees, getAllTechnicians, getUser };
