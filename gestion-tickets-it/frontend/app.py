import streamlit as st
from utils.api import ApiClient
from utils.auth import login_user, logout_user, check_authentication, get_current_user, is_admin, is_technician, is_employee
import config

# Configuration de la page
st.set_page_config(
    page_title="Système de Tickets de Support IT",
    page_icon="🎫",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialisation de l'API client
@st.cache_resource
def get_api_client():
    return ApiClient(config.API_URL)

api_client = get_api_client()

# Initialisation de la session si nécessaire
if "is_logged_in" not in st.session_state:
    st.session_state.is_logged_in = False

# Sidebar pour la navigation et les informations utilisateur
with st.sidebar:
    st.title("🎫 Support IT")
    
    if check_authentication():
        user = get_current_user()
        st.write(f"👤 Connecté en tant que: **{user.get('nom')}**")
        st.write(f"🔑 Rôle: **{user.get('role')}**")
        
        # Menu de navigation basé sur le rôle
        st.subheader("Navigation")
        
        if is_employee():  # Tous les utilisateurs ont au moins les privilèges d'employé
            if st.sidebar.button("📝 Mes tickets"):
                st.session_state.page = "employee_tickets"
                
            if st.sidebar.button("➕ Nouveau ticket"):
                st.session_state.page = "new_ticket"
        
        if is_technician():  # Techniciens et admins
            if st.sidebar.button("🔧 Tickets à traiter"):
                st.session_state.page = "tech_tickets"
        
        if is_admin():  # Admin uniquement
            if st.sidebar.button("👥 Gestion utilisateurs"):
                st.session_state.page = "admin_users"
                
            if st.sidebar.button("📊 Tableau de bord"):
                st.session_state.page = "admin_dashboard"
        
        # Bouton de déconnexion
        if st.sidebar.button("🚪 Déconnexion"):
            logout_user()
            st.experimental_rerun()
    
    st.divider()
    st.caption("© 2025 Support IT - DevOps Project")

# Page principale
if not check_authentication():
    # Formulaire de connexion
    st.title("Connexion au système de tickets")
    
    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Mot de passe", type="password")
        submit = st.form_submit_button("Se connecter")
        
        if submit:
            if email and password:
                user = login_user(api_client, email, password)

                if user:
                    st.success(f"Bienvenue, {user.get('email')}!")
                    st.experimental_rerun()

                else:
                    st.error("Email ou mot de passe incorrect.")
            else:
                st.warning("Veuillez remplir tous les champs.")
else:
    # Rediriger vers la page appropriée en fonction du rôle et de la navigation
    if not hasattr(st.session_state, "page"):
        # Page par défaut selon le rôle
        user = get_current_user()
        if user.get("role") == "Admin":
            st.session_state.page = "admin_dashboard"
        elif user.get("role") == "Technicien":
            st.session_state.page = "tech_tickets"
        else:
            st.session_state.page = "employee_tickets"
    
    # Afficher la page sélectionnée
    if st.session_state.page == "employee_tickets":
        st.title("Mes tickets")
        user_id = get_current_user().get("id")
        tickets = api_client.get_tickets({"id_employe": user_id})
        
        # Fonction pour afficher les détails d'un ticket
        def view_ticket_details(ticket_id):
            st.session_state.selected_ticket_id = ticket_id
            st.session_state.page = "ticket_details"
        
        # Importer et utiliser la fonction d'affichage des tickets
        from utils.ui import display_ticket_list
        display_ticket_list(tickets, on_click=view_ticket_details)
        
    elif st.session_state.page == "new_ticket":
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
                        "priorite": priorite,
                    }
                    
                    result = api_client.create_ticket(ticket_data)
                    if result:
                        st.success(f"Ticket #{result.get('id')} créé avec succès!")
                        # Rediriger vers la liste des tickets
                        st.session_state.page = "employee_tickets"
                        st.experimental_rerun()
                else:
                    st.warning("Veuillez remplir tous les champs obligatoires.")
    
    elif st.session_state.page == "ticket_details":
        # Vérifier si un ticket est sélectionné
        if not hasattr(st.session_state, "selected_ticket_id"):
            st.warning("Aucun ticket sélectionné.")
            st.session_state.page = "employee_tickets"
            st.experimental_rerun()
        
        ticket_id = st.session_state.selected_ticket_id
        ticket = api_client.get_ticket(ticket_id)
        
        # Bouton de retour
        if st.button("← Retour à la liste"):
            # Rediriger en fonction du rôle
            user = get_current_user()
            if user.get("role") == "Technicien":
                st.session_state.page = "tech_tickets"
            else:
                st.session_state.page = "employee_tickets"
            st.experimental_rerun()
        
        st.title(f"Ticket #{ticket_id}: {ticket.get('titre', '')}")
        
        # Afficher les détails du ticket
        from utils.ui import display_ticket_details
        display_ticket_details(ticket)
        
        # Si l'utilisateur est technicien ou admin, il peut mettre à jour le statut
        if is_technician():
            st.subheader("Mettre à jour le ticket")
            
            with st.form("update_ticket_form"):
                nouveau_statut = st.selectbox("Nouveau statut", config.TICKET_STATUS)
                
                # Pour les techniciens, possibilité de s'assigner le ticket
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
    
    elif st.session_state.page == "tech_tickets":
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
            st.session_state.page = "ticket_details"
        
        # Afficher la liste des tickets
        from utils.ui import display_ticket_list
        display_ticket_list(tickets, on_click=view_ticket_details)
    
    elif st.session_state.page == "admin_dashboard":
        st.title("Tableau de bord administrateur")
        
        # Récupérer les statistiques
        stats = api_client.get_statistics()
        
        # Afficher les statistiques
        from utils.ui import display_statistics
        display_statistics(stats)
    
    elif st.session_state.page == "admin_users":
        st.title("Gestion des utilisateurs")
        
        # Onglets pour différentes fonctionnalités
        tab1, tab2 = st.tabs(["Liste des utilisateurs", "Ajouter un utilisateur"])
        
        with tab1:
            # Filtre par rôle
            role_filter = st.selectbox("Filtrer par rôle", ["Tous"] + config.USER_ROLES)
            
            # Récupérer les utilisateurs selon le rôle sélectionné
            if role_filter == "Technicien":
                # Récupérer les techniciens
                users = api_client.get_technicians(role=role_filter)
            elif role_filter == "Employé":
                # Récupérer les utilisateurs selon le rôle filtré
                users = api_client.get_employees(role=role_filter)
            elif role_filter == "Admin":
                
                users = api_client.get_admins(role=role_filter)
            else:
                # Récupérer tous les utilisateurs si "Tous" est sélectionné
                users = api_client.get_users()
            
            # Fonction pour afficher les détails d'un utilisateur
            def view_user_details(user_id):
                st.session_state.selected_user_id = user_id
                st.session_state.page = "user_details"
            
            # Afficher la liste des utilisateurs
            from utils.ui import display_user_list
            display_user_list(users, on_click=view_user_details)
        
        with tab2:
            with st.form("add_user_form"):
                nom = st.text_input("Nom complet")
                email = st.text_input("Adresse email")
                password = st.text_input("Mot de passe", type="password")
                role = st.selectbox("Rôle", config.USER_ROLES)
                
                submit = st.form_submit_button("Créer l'utilisateur")
                
                if submit:
                    if nom and email and password:
                        # Créer l'utilisateur
                        user_data = {
                            "nom": nom,
                            "email": email,
                            "mot_de_passe": password,
                            "role": role
                        }
                        
                        result = api_client.create_user(user_data)
                        if result:
                            st.success(f"Utilisateur {nom} créé avec succès!")
                        else:
                            st.error("Erreur lors de la création de l'utilisateur.")
                    else:
                        st.warning("Veuillez remplir tous les champs obligatoires.")
    
    elif st.session_state.page == "user_details":
        # Vérifier si un utilisateur est sélectionné
        if not hasattr(st.session_state, "selected_user_id"):
            st.warning("Aucun utilisateur sélectionné.")
            st.session_state.page = "admin_users"
            st.experimental_rerun()
        
        user_id = st.session_state.selected_user_id
        user = api_client.get_user(user_id)
        
        # Bouton de retour
        if st.button("← Retour à la liste"):
            st.session_state.page = "admin_users"
            st.experimental_rerun()
        
        st.title(f"Utilisateur: {user.get('nom', '')}")
        
        # Afficher les détails de l'utilisateur
        col1, col2 = st.columns(2)
        
        with col1:
            st.write(f"**ID:** {user.get('id', 'N/A')}")
            st.write(f"**Nom:** {user.get('nom', 'N/A')}")
            st.write(f"**Email:** {user.get('email', 'N/A')}")
        
        with col2:
            st.write(f"**Rôle:** {user.get('role', 'N/A')}")
            st.write(f"**Date d'inscription:** {user.get('date_inscription', 'N/A')}")
        
        # Formulaire de mise à jour
        st.subheader("Mettre à jour l'utilisateur")
        
        with st.form("update_user_form"):
            nouveau_nom = st.text_input("Nom", value=user.get('nom', ''))
            nouvel_email = st.text_input("Email", value=user.get('email', ''))
            nouveau_password = st.text_input("Nouveau mot de passe (laisser vide pour conserver l'actuel)", type="password")
            nouveau_role = st.selectbox("Rôle", config.USER_ROLES, index=config.USER_ROLES.index(user.get('role', config.USER_ROLES[0])))
            
            col1, col2 = st.columns(2)
            
            with col1:
                submit_update = st.form_submit_button("Mettre à jour")
            
            with col2:
                submit_delete = st.form_submit_button("Supprimer l'utilisateur")
            
            if submit_update:
                update_data = {}
                if nouveau_nom != user.get('nom', ''):
                    update_data["nom"] = nouveau_nom
                if nouvel_email != user.get('email', ''):
                    update_data["email"] = nouvel_email
                if nouveau_password:
                    update_data["mot_de_passe"] = nouveau_password
                if nouveau_role != user.get('role', ''):
                    update_data["role"] = nouveau_role
                
                if update_data:
                    result = api_client.update_user(user_id, update_data)
                    if result:
                        st.success("Utilisateur mis à jour avec succès!")
                        st.experimental_rerun()
                    else:
                        st.error("Erreur lors de la mise à jour de l'utilisateur.")
            
            if submit_delete:
                confirm_delete = st.checkbox("Confirmer la suppression de cet utilisateur")
                if confirm_delete:
                    result = api_client.delete_user(user_id)
                    if result:
                        st.success("Utilisateur supprimé avec succès!")
                        st.session_state.page = "admin_users"
                        st.experimental_rerun()
                    else:
                        st.error("Erreur lors de la suppression de l'utilisateur.")
