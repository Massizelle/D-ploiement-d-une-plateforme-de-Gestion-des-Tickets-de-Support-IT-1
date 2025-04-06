import requests
import streamlit as st
import json
from typing import Dict, List, Optional, Any

class ApiClient:
    """Client pour communiquer avec l'API de tickets de support."""
    
    def __init__(self, base_url: str):
        """
        Initialise le client API.
        
        Args:
            base_url: URL de base de l'API
        """
        self.base_url = base_url
        
    def _get_headers(self) -> Dict[str, str]:
        """Crée les en-têtes pour les requêtes API."""
        return {"Content-Type": "application/json"}
    
    def verify_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Vérifie si un utilisateur existe dans la base de données.
        
        Args:
            email: Adresse email de l'utilisateur
            password: Mot de passe de l'utilisateur
            
        Returns:
            Informations de l'utilisateur si authentifié, sinon un dictionnaire vide
        """
        response = requests.post(
            f"{self.base_url}/auth/verify",
            headers=self._get_headers(),
            data=json.dumps({"email": email, "mot_de_passe": password})
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {}
    
    # === TICKETS ===
    
    def get_tickets(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des tickets avec filtres optionnels.
        
        Args:
            filters: Critères de filtrage (statut, priorité, id_employe, id_technicien, etc.)
            
        Returns:
            Liste des tickets correspondant aux critères
        """
        params = filters if filters else {}
        response = requests.get(
            f"{self.base_url}/tickets",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des tickets: {response.status_code}, {response.text}")
            return []
    
    def get_ticket(self, ticket_id: int) -> Dict[str, Any]:
        """
        Récupère les détails d'un ticket.
        
        Args:
            ticket_id: Identifiant du ticket
            
        Returns:
            Informations détaillées du ticket
        """
        response = requests.get(
            f"{self.base_url}/tickets/{ticket_id}",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération du ticket: {response.status_code}, {response.text}")
            return {}
        



    def delete_ticket(self, ticket_id: int) -> Dict[str, Any]:
        """
        Récupère les détails d'un ticket.
        
        Args:
            ticket_id: Identifiant du ticket
            
        Returns:
            Informations détaillées du ticket
        """
        response = requests.delete(
            f"{self.base_url}/tickets/{ticket_id}",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la suppression du ticket: {response.status_code}, {response.text}")
            return {}
        

    
    def create_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un nouveau ticket.
        
        Args:
            ticket_data: Données du ticket à créer
            
        Returns:
            Ticket créé
        """
        response = requests.post(
            f"{self.base_url}/tickets",
            headers=self._get_headers(),
            data=json.dumps(ticket_data)
        )
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            st.error(f"Erreur lors de la création du ticket: {response.status_code}, {response.text}")
            return {}
    
    def update_ticket(self, ticket_id: int, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Met à jour un ticket existant.
        
        Args:
            ticket_id: Identifiant du ticket à mettre à jour
            ticket_data: Nouvelles données du ticket
            
        Returns:
            Ticket mis à jour
        """
        response = requests.put(
            f"{self.base_url}/tickets/{ticket_id}",
            headers=self._get_headers(),
            data=json.dumps(ticket_data)
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la mise à jour du ticket: {response.status_code}, {response.text}")
            return {}
      
    # === UTILISATEURS ===
    
    def get_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des utilisateurs, éventuellement filtrée par rôle.
        
        Args:
            role: Rôle des utilisateurs à récupérer (optionnel)
            
        Returns:
            Liste des utilisateurs
        """
        params = {"role": role} if role else {}
        response = requests.get(
            f"{self.base_url}/users",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des utilisateurs: {response.status_code}, {response.text}")
            return []
        

    




    def get_technicians(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des utilisateurs, éventuellement filtrée par rôle.
        
        Args:
            role: Rôle des utilisateurs à récupérer (optionnel)
            
        Returns:
            Liste des utilisateurs
        """
        params = {"role": role} if role else {}
        response = requests.get(
            f"{self.base_url}/users/technicians",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des utilisateurs: {response.status_code}, {response.text}")
            return []
        


    def get_admins(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des utilisateurs, éventuellement filtrée par rôle.
        
        Args:
            role: Rôle des utilisateurs à récupérer (optionnel)
            
        Returns:
            Liste des utilisateurs
        """
        params = {"role": role} if role else {}
        response = requests.get(
            f"{self.base_url}/users/admins",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des utilisateurs: {response.status_code}, {response.text}")
            return []
        


    def get_employees(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Récupère la liste des utilisateurs, éventuellement filtrée par rôle.
        
        Args:
            role: Rôle des utilisateurs à récupérer (optionnel)
            
        Returns:
            Liste des utilisateurs
        """
        params = {"role": role} if role else {}
        response = requests.get(
            f"{self.base_url}/users/employees",
            headers=self._get_headers(),
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des utilisateurs: {response.status_code}, {response.text}")
            return []








        
    
    def get_user(self, user_id: int) -> Dict[str, Any]:
        """
        Récupère les détails d'un utilisateur.
        
        Args:
            user_id: Identifiant de l'utilisateur
            
        Returns:
            Informations détaillées de l'utilisateur
        """
        response = requests.get(
            f"{self.base_url}/users/{user_id}",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération de l'utilisateur: {response.status_code}, {response.text}")
            return {}
        
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un nouvel utilisateur.
        
        Args:
            user_data: Données de l'utilisateur à créer
            
        Returns:
            Utilisateur créé
        """
        response = requests.post(
            f"{self.base_url}/users",
            headers=self._get_headers(),
            data=json.dumps(user_data)
        )
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            st.error(f"Erreur lors de la création de l'utilisateur: {response.status_code}, {response.text}")
            return {}
    
    def update_user(self, user_id: int, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Met à jour un utilisateur existant.
        
        Args:
            user_id: Identifiant de l'utilisateur à mettre à jour
            user_data: Nouvelles données de l'utilisateur
            
        Returns:
            Utilisateur mis à jour
        """
        response = requests.put(
            f"{self.base_url}/users/{user_id}",
            headers=self._get_headers(),
            data=json.dumps(user_data)
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la mise à jour de l'utilisateur: {response.status_code}, {response.text}")
            return {}
    
    def delete_user(self, user_id: int) -> bool:
        """
        Supprime un utilisateur.
        
        Args:
            user_id: Identifiant de l'utilisateur à supprimer
            
        Returns:
            True si la suppression a réussi, False sinon
        """
        response = requests.delete(
            f"{self.base_url}/users/{user_id}",
            headers=self._get_headers()
        )
        
        if response.status_code in [200, 204]:
            return True
        else:
            st.error(f"Erreur lors de la suppression de l'utilisateur: {response.status_code}, {response.text}")
            return False
    
    # === STATISTIQUES ===
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Récupère les statistiques pour le tableau de bord.
        
        Returns:
            Statistiques de l'application
        """
        response = requests.get(
            f"{self.base_url}/statistics",
            headers=self._get_headers()
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Erreur lors de la récupération des statistiques: {response.status_code}, {response.text}")
            return {}