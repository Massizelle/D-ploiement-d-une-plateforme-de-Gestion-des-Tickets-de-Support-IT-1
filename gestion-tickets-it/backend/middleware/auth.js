const jwt = require('jsonwebtoken');

// Créer le secret JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

module.exports = (req, res, next) => {
    // Récupérer le token du header
    const token = req.header('x-auth-token');
    
    // Vérifier si le token existe
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }
    
    try {
        // Vérifier le token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Ajouter l'utilisateur à la requête
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
};