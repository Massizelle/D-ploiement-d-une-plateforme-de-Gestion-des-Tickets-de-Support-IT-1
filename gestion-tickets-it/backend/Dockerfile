# Utilise l'image officielle Node.js
FROM node:18

# Ajoute les labels recommandés
LABEL Name="GestionTicketsBackend" \
      Version="1.0"

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste
COPY . .

# Ouvrir le port (ajuste si nécessaire)
EXPOSE 3001

# Lancer le serveur
CMD ["node", "src/server.js"]
