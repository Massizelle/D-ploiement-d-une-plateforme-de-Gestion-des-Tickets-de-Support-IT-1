import streamlit as st
from utils.api import ApiClient
from utils.auth import check_authentication, get_current_user, logout_user, is_technician
from utils.ui import display_ticket_list, display_ticket_details
import config

def show():
    # Vérifier l'authentification et les autorisations
    if not check_authentication():
        st.warning("Vous devez être connecté pour accéder à cette page.")
        st.session_state.page = "login"
        st.experimental_rerun()
        return
    
    if not is_technician():
        st.error("Vous n'avez pas les autorisations nécessaires pour accéder à cette page.")
        st.session_state.page = "employee_tickets"
        st.experimental_rerun()
        return
    
    # Sidebar pour la navigation
    with st.sidebar:
        st.title("🎫 Support IT")
        
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        st.subheader("Navigation")
        
        if st.sidebar.button("🔧 Tickets à traiter"):
            st.session_state.page = "tech_tickets"
            st.experimental_rerun()
        
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
    
    # Afficher la liste des tickets à traiter
    st.title("Tickets à traiter")
    
    # Filtres pour les techniciens
    col1, col2, col3 = st.columns(3)
    
    with col1:
        filter_status = st.selectbox("Filtrer par statut", ["Tous"] + config.TICKET_STATUS)
    
    with col2:
        filter_priority = st.selectbox("Filtrer par priorité", ["Toutes"] + config.PRIORITY_LEVELS)
    
    with col3:
        filter_assigned = st.radio("Afficher", ["Tous les tickets", "Mes tickets assignés", "Tickets non assignés"])
    
    # Préparer les filtres
    filters = {}
    
    if filter_status != "Tous":
        filters["statut"] = filter_status
        
    if filter_priority != "Toutes":
        filters["priorité"] = filter_priority
    
    if filter_assigned == "Mes tickets assignés":
        filters["id_technicien"] = get_current_user().get("id")
    elif filter_assigned == "Tickets non assignés":
        filters["id_technicien"] = None
    
    # Récupérer les tickets selon les filtres
    tickets = api_client.get_tickets(filters)
    
    # Fonction pour afficher les détails d'un ticket
    def view_ticket_details(ticket_id):
        st.session_state.selected_ticket_id = ticket_id
        st.session_state.page = "tech_ticket_details"
        st.experimental_rerun()
    
    # Afficher la liste des tickets
    display_ticket_list(tickets, on_click=view_ticket_details)

def show_ticket_details():
    # Vérifier l'authentification et les autorisations
    if not check_authentication():
        st.warning("Vous devez être connecté pour accéder à cette page.")
        st.session_state.page = "login"
        st.experimental_rerun()
        return
    
    if not is_technician():
        st.error("Vous n'avez pas les autorisations nécessaires pour accéder à cette page.")
        st.session_state.page = "employee_tickets"
        st.experimental_rerun()
        return
    
    # Vérifier si un ticket est sélectionné
    if not hasattr(st.session_state, "selected_ticket_id"):
        st.warning("Aucun ticket sélectionné.")
        st.session_state.page = "tech_tickets"
        st.experimental_rerun()
        return
    
    # Sidebar pour la navigation
    with st.sidebar:
        st.title("🎫 Support IT")
        
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        st.subheader("Navigation")
        
        if st.sidebar.button("🔧 Tickets à traiter"):
            st.session_state.page = "tech_tickets"
            st.experimental_rerun()
        
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
        st.session_state.page = "tech_tickets"
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
    
    # Section pour mettre à jour le ticket
    st.subheader("Mettre à jour le ticket")
    
    with st.form("update_ticket_form"):
        nouveau_statut = st.selectbox("Nouveau statut", config.TICKET_STATUS, index=config.TICKET_STATUS.index(ticket.get('statut', config.TICKET_STATUS[0])))
        
        # Possibilité de s'assigner le ticket s'il n'est pas déjà assigné
        if ticket.get("id_technicien") is None or ticket.get("id_technicien") == "":
            assigner_a_moi = st.checkbox("M'assigner ce ticket")
        
        soumettre_maj = st.form_submit_button("Mettre à jour")
        
        if soumettre_maj:
            update_data = {"statut": nouveau_statut}
            
            # Assigner le ticket au technicien actuel si demandé
            if "assigner_a_moi" in locals() and assigner_a_moi:
                update_data["id_technicien"] = get_current_user().get("id")
            
            result = api_client.update_ticket(ticket_id, update_data)
            if result:
                st.success("Ticket mis à jour avec succès!")
                st.experimental_rerun()
            else:
                st.error("Erreur lors de la mise à jour du ticket.")