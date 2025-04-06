# Utilise une image officielle Python pour Streamlit
FROM python:3.10-slim

# Ajoute les labels recommandés
LABEL Name="GestionTicketsFrontend" \
      Version="1.0"

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY . .

# Installer les dépendances
RUN pip install --no-cache-dir streamlit pandas numpy

# Ouvrir le port Streamlit
EXPOSE 8501

# Lancer l'application
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
