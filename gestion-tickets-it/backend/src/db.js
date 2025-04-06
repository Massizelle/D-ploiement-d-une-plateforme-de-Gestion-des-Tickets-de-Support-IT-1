const mysql = require('mysql2');

// Créer une connexion à la base de données
const pool = mysql.createPool({
  host: 'localhost', // Adresse du serveur MySQL
  user: 'root',      // Utilisateur MySQL
  password: 'admin',      // Mot de passe de l'utilisateur MySQL
  database: 'system_tickets', // Nom de la base de données
});

// Créer un wrapper pour effectuer des requêtes
const promisePool = pool.promise();

// Connexion à la base de données
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err.stack);
    return;
  }
  console.log('Connecté à la base de données MySQL');
  connection.release(); // Relâcher la connexion après la vérification
});

module.exports = promisePool;
