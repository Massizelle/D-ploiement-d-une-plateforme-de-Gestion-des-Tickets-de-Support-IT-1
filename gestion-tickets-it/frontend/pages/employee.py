import streamlit as st
from utils.api import ApiClient
from utils.auth import check_authentication, get_current_user, logout_user
from utils.ui import display_ticket_list, display_ticket_details
import config

def show():
    # Vérifier l'authentification
    if not check_authentication():
        st.warning("Vous devez être connecté pour accéder à cette page.")
        st.session_state.page = "login"
        st.experimental_rerun()
        return
    
    # Sidebar pour la navigation
    with st.sidebar:
        st.title("🎫 Support IT")
        
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        st.subheader("Navigation")
        
        if st.sidebar.button("📝 Mes tickets"):
            st.session_state.page = "employee_tickets"
            st.experimental_rerun()
            
        if st.sidebar.button("➕ Nouveau ticket"):
            st.session_state.page = "new_ticket"
            st.experimental_rerun()
        
        # Bouton de déconnexion
        if st.sidebar.button("🚪 Déconnexion"):
            logout_user()
            st.session_state.page = "login"
            st.experimental_rerun()
    
    # Initialisation de l'API client
    api_client = ApiClient(config.API_URL)
    
    # Afficher la liste des tickets de l'employé
    st.title("Mes tickets")
    
    # Filtres simples
    col1, col2 = st.columns(2)
    
    with col1:
        filter_status = st.selectbox("Filtrer par statut", ["Tous"] + config.TICKET_STATUS)
    
    with col2:
        filter_priority = st.selectbox("Filtrer par priorité", ["Toutes"] + config.PRIORITY_LEVELS)
    
    # Préparer les filtres
    filters = {"id_employe": get_current_user().get("id")}
    
    if filter_status != "Tous":
        filters["statut"] = filter_status
        
    if filter_priority != "Toutes":
        filters["priorité"] = filter_priority
    
    # Récupérer les tickets selon les filtres
    tickets = api_client.get_tickets(filters)
    
    # Fonction pour afficher les détails d'un ticket
    def view_ticket_details(ticket_id):
        st.session_state.selected_ticket_id = ticket_id
        st.session_state.page = "ticket_details"
        st.experimental_rerun()
    
    # Afficher la liste des tickets
    display_ticket_list(tickets, on_click=view_ticket_details)
    
    # Bouton pour créer un nouveau ticket
    if st.button("Créer un nouveau ticket", type="primary"):
        st.session_state.page = "new_ticket"
        st.experimental_rerun()

def show_new_ticket():
    # Vérifier l'authentification
    if not check_authentication():
        st.warning("Vous devez être connecté pour accéder à cette page.")
        st.session_state.page = "login"
        st.experimental_rerun()
        return
    
    # Sidebar pour la navigation (même que dans show())
    with st.sidebar:
        st.title("🎫 Support IT")
        
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        st.subheader("Navigation")
        
        if st.sidebar.button("📝 Mes tickets"):
            st.session_state.page = "employee_tickets"
            st.experimental_rerun()
            
        if st.sidebar.button("➕ Nouveau ticket"):
            st.session_state.page = "new_ticket"
            st.experimental_rerun()
        
        # Bouton de déconnexion
        if st.sidebar.button("🚪 Déconnexion"):
            logout_user()
            st.session_state.page = "login"
            st.experimental_rerun()
    
    # Initialisation de l'API client
    api_client = ApiClient(config.API_URL)
    
    # Formulaire de création de ticket
    st.title("Créer un nouveau ticket")
    
    with st.form("new_ticket_form"):
        titre = st.text_input("Titre du problème")
        description = st.text_area("Description détaillée")
        priorite = st.selectbox("Priorité", config.PRIORITY_LEVELS)
        
        submit = st.form_submit_button("Soumettre le ticket")
        
        if submit:
            if titre and description:
                # Créer le ticket
                ticket_data = {
                    "titre": titre,
                    "description": description,
                    "priorité": priorite,
                    "statut": "Ouvert",  # Par défaut
                    "id_employe": get_current_user().get("id")
                }
                
                result = api_client.create_ticket(ticket_data)
                if result:
                    st.success(f"Ticket #{result.get('id')} créé avec succès!")
                    # Rediriger vers la liste des tickets
                    st.session_state.page = "employee_tickets"
                    st.experimental_rerun()
                else:
                    st.error("Erreur lors de la création du ticket.")
            else:
                st.warning("Veuillez remplir tous les champs obligatoires.")
    
    # Bouton pour annuler
    if st.button("Annuler"):
        st.session_state.page = "employee_tickets"
        st.experimental_rerun()

def show_ticket_details():
    # Vérifier l'authentification
    if not check_authentication():
        st.warning("Vous devez être connecté pour accéder à cette page.")
        st.session_state.page = "login"
        st.experimental_rerun()
        return
    
    # Vérifier si un ticket est sélectionné
    if not hasattr(st.session_state, "selected_ticket_id"):
        st.warning("Aucun ticket sélectionné.")
        st.session_state.page = "employee_tickets"
        st.experimental_rerun()
        return
    
    # Sidebar pour la navigation (même que dans show())
    with st.sidebar:
        st.title("🎫 Support IT")
        
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        st.subheader("Navigation")
        
        if st.sidebar.button("📝 Mes tickets"):
            st.session_state.page = "employee_tickets"
            st.experimental_rerun()
            
        if st.sidebar.button("➕ Nouveau ticket"):
            st.session_state.page = "new_ticket"
            st.experimental_rerun()
        
        # Bouton de déconnexion
        if st.sidebar.button("🚪 Déconnexion"):
            logout_user()
            st.session_state.page = "login"
            st.experimental_rerun()
    
    # Initialisation de l'API client
    api_client = ApiClient(config.API_URL)
    
    ticket_id = st.session_state.selected_ticket_id
    ticket = api_client.get_ticket(ticket_id)
    comments = api_client.get_comments(ticket_id)
    
    # Bouton de retour
    if st.button("← Retour à la liste"):
        st.session_state.page = "employee_tickets"
        st.experimental_rerun()
    
    st.title(f"Ticket #{ticket_id}: {ticket.get('titre', '')}")
    
    # Afficher les détails du ticket
    display_ticket_details(ticket, comments)
    
    # Section pour ajouter un commentaire
    st.subheader("Ajouter un commentaire")
    with st.form("add_comment_form"):
        comment_text = st.text_area("Votre commentaire")
        submit_comment = st.form_submit_button("Envoyer")
        
        if submit_comment and comment_text:
            comment_data = {
                "contenu": comment_text,
                "id_ticket": ticket_id,
                "id_utilisateur": get_current_user().get("id")
            }
            
            result = api_client.add_comment(ticket_id, comment_data)
            if result:
                st.success("Commentaire ajouté avec succès!")
                st.experimental_rerun()
            else:
                st.error("Erreur lors de l'ajout du commentaire.")