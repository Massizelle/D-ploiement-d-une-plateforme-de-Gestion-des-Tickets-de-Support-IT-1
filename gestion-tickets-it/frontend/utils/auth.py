import streamlit as st
from utils.api import ApiClient
from typing import Dict, Optional, Any

def login_user(api_client: ApiClient, email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Vérifie les identifiants utilisateur et initialise la session si valides.
    
    Args:
        api_client: Client API pour communiquer avec le backend
        email: Email de l'utilisateur
        password: Mot de passe de l'utilisateur
        
    Returns:
        Données de l'utilisateur si authentifié, None sinon
    """
    user_data = api_client.verify_user(email, password)
    
    if user_data:
        # Stocker les infos utilisateur dans la session
        st.session_state.user = user_data
        st.session_state.is_logged_in = True
        return user_data
    
    return None

def logout_user() -> None:
    """Déconnecte l'utilisateur en effaçant ses données de session."""
    if "user" in st.session_state:
        del st.session_state.user
    
    st.session_state.is_logged_in = False

def check_authentication() -> bool:
    """
    Vérifie si l'utilisateur est connecté.
    
    Returns:
        True si l'utilisateur est connecté, False sinon
    """
    return st.session_state.get("is_logged_in", False)

def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Récupère les données de l'utilisateur actuel.
    
    Returns:
        Données de l'utilisateur connecté ou None
    """
    return st.session_state.get("user")

def has_role(role: str) -> bool:
    """
    Vérifie si l'utilisateur connecté a le rôle spécifié.
    
    Args:
        role: Rôle à vérifier
        
    Returns:
        True si l'utilisateur a le rôle spécifié, False sinon
    """
    user = get_current_user()
    if not user:
        return False
    
    return user.get("role") == role

def is_admin() -> bool:
    """
    Vérifie si l'utilisateur est administrateur.
    
    Returns:
        True si l'utilisateur est admin, False sinon
    """
    return has_role("Admin")

def is_technician() -> bool:
    """
    Vérifie si l'utilisateur est technicien.
    
    Returns:
        True si l'utilisateur est technicien, False sinon
    """
    return has_role("Technicien") or is_admin()  # Admin a tous les privilèges

def is_employee() -> bool:
    """
    Vérifie si l'utilisateur est employé.
    
    Returns:
        True si l'utilisateur est employé, False sinon
    """
    # Tous les utilisateurs ont au moins les privilèges d'employé
    return check_authentication()