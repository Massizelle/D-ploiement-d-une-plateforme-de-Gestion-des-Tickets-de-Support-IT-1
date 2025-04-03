 CREATE DATABASE IF NOT EXISTS system_tickets;
USE system_tickets;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('Employé', 'Technicien', 'Admin') NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    statut ENUM('Ouvert', 'En cours', 'Résolu', 'Fermé') DEFAULT 'Ouvert',
    priorite ENUM('Faible', 'Moyenne', 'Élevée', 'Critique') DEFAULT 'Moyenne',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_employe INT NOT NULL,
    id_technicien INT,
    FOREIGN KEY (id_employe) REFERENCES utilisateurs(id),
    FOREIGN KEY (id_technicien) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS commentaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_ticket INT NOT NULL,
    id_utilisateur INT NOT NULL,
    FOREIGN KEY (id_ticket) REFERENCES tickets(id),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id)
);

-- Insérer des utilisateurs de test
INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES
('Admin Test', 'admin@example.com', '$2a$10$a1YDx/E3AOI5AZyGECZUx.9RVVnW87WOFK1zgxqbK.eOK/yMEtlsG', 'Admin'), -- mot de passe: admin123
('Tech Test', 'tech@example.com', '$2a$10$a1YDx/E3AOI5AZyGECZUx.9RVVnW87WOFK1zgxqbK.eOK/yMEtlsG', 'Technicien'), -- mot de passe: tech123
('Employe Test', 'employe@example.com', '$2a$10$a1YDx/E3AOI5AZyGECZUx.9RVVnW87WOFK1zgxqbK.eOK/yMEtlsG', 'Employé'); -- mot de passe: employe123
