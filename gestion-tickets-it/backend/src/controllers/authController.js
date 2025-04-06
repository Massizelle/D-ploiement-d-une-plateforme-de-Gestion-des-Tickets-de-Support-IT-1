const db = require('./../db');

const loginUser = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Les champs email et mot de passe sont obligatoires' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND mot_de_passe = ?',
      [email, mot_de_passe]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    res.status(200).json({ email: rows[0].email, mot_de_passe: rows[0].mot_de_passe, nom: rows[0].nom, role: rows[0].role });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: err });
  }
};

module.exports = { loginUser };
