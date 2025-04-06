const express = require('express');
const bodyParser = require('body-parser');
const userRoute = require('./src/routes/userRoute');
const ticketRoute = require('./src/routes/ticketRoute');
const authRoute = require('./src/routes/authRoute');
const statsRoute = require('./src/routes/statsRoute')

// Créer l'application Express
const app = express();

// Middleware pour parser le body des requêtes en JSON
app.use(bodyParser.json());

app.use(express.json());


// Ajouter les routes des utilisateurs
app.use('/api', userRoute);

// Route pour les tickets

app.use('/api', ticketRoute);


app.use('/api', authRoute);


app.use('/api', statsRoute);

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});