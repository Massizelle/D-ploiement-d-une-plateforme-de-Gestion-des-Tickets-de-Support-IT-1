import streamlit as st
import pandas as pd
from typing import Dict, List, Any, Optional, Callable

def display_ticket_list(tickets: List[Dict[str, Any]], on_click: Optional[Callable[[int], None]] = None) -> None:
    if not tickets:
        st.info("Aucun ticket disponible.")
        return
    
    df = pd.DataFrame(tickets)
    
    if not df.empty:
        columns_to_display = {
            "id": "ID",
            "titre": "Titre",
            "statut": "Statut",
            "priorité": "Priorité",
            "date_creation": "Créé le",
            "date_mise_a_jour": "Mis à jour le"
        }
        
        available_columns = [col for col in columns_to_display if col in df.columns]
        display_columns = {col: columns_to_display[col] for col in available_columns}
        
        df_display = df[available_columns].rename(columns=display_columns)
        
        # Affichage du tableau des tickets avec les informations
        # st.dataframe(df_display)
        
        # Ajouter le bouton "Voir détails" avec le numéro du ticket sur la même ligne
        if on_click:
            for i, ticket in df.iterrows():
                cols = st.columns(len(columns_to_display))  # Créer autant de colonnes que de champs
                
                # Afficher les informations du ticket dans les colonnes
                for j, column in enumerate(available_columns):
                    cols[j].write(ticket[column])  # Afficher les informations dans les colonnes
                
                # Ajouter le bouton "Voir détails" dans la dernière colonne
                if cols[-1].button(f"Voir détails", key=f"ticket_{ticket['id']}", help=f"Voir les détails du ticket #{ticket['id']}"):
                    on_click(ticket['id'])
                
                # Ajouter un espacement après chaque ligne de ticket
                st.empty()  # Crée un espace entre les lignes de tickets
    else:
        st.info("Aucun ticket disponible.")




def display_ticket_details(ticket: Dict[str, Any]) -> None:
    if not ticket:
        st.error("Ticket introuvable.")
        return
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader(ticket.get("titre", "Sans titre"))
        st.write(f"**ID:** {ticket.get('id', 'N/A')}")
        st.write(f"**Statut:** {ticket.get('statut', 'N/A')}")
        st.write(f"**Priorité:** {ticket.get('priorité', 'N/A')}")
    
    with col2:
        st.write(f"**Créé le:** {ticket.get('date_creation', 'N/A')}")
        st.write(f"**Dernière mise à jour:** {ticket.get('date_mise_a_jour', 'N/A')}")
        st.write(f"**Créé par:** {ticket.get('id_employe', 'N/A')}")
        st.write(f"**Assigné à:** {ticket.get('id_technicien', 'N/A') or 'Non assigné'}")
    
    st.subheader("Description")
    st.write(ticket.get("description", "Aucune description"))

def display_user_list(users: List[Dict[str, Any]], on_click: Optional[Callable[[int], None]] = None) -> None:
    if not users:
        st.info("Aucun utilisateur disponible.")
        return
    
    # Créer un DataFrame à partir de la liste d'utilisateurs
    df = pd.DataFrame(users)
    
    if not df.empty:
        columns_to_display = {
            "id": "ID",
            "nom": "Nom",
            "email": "Email",
            "role": "Rôle",
            "date_inscription": "Date d'inscription"
        }
        
        # Filtrer les colonnes disponibles dans le DataFrame
        available_columns = [col for col in columns_to_display if col in df.columns]
        display_columns = {col: columns_to_display[col] for col in available_columns}
        
        df_display = df[available_columns].rename(columns=display_columns)
        
        # Afficher les utilisateurs dans une disposition de colonnes
        for index, user in df.iterrows():
            cols = st.columns(len(columns_to_display))  # Crée autant de colonnes que de champs + 1 pour le bouton
            
            # Afficher les informations de l'utilisateur dans les colonnes
            for i, column in enumerate(available_columns):
                cols[i].write(user[column])  # Afficher les informations de l'utilisateur dans les colonnes
            
            # Ajouter le bouton "Voir détails" dans la dernière colonne
            if cols[-1].button(f"Voir détails", key=f"user_{user['id']}", help=f"Voir les détails de l'utilisateur #{user['id']}"):
                on_click(user['id'])  # Appeler la fonction pour afficher les détails de l'utilisateur
            
    else:
        st.info("Aucun utilisateur disponible.")


def display_statistics(stats: Dict[str, Any]) -> None:

    if not stats:
        st.error("Impossible de récupérer les statistiques.")
        return
    
    col1, col2, col3, col4 = st.columns(4)

    
    with col1:
        st.metric("Tickets ouverts", stats["stats_par_statut"].get("total_ouverts", 0))
    with col2:
        st.metric("En cours", stats["stats_par_statut"].get("total_en_cours", 0))
    with col3:
        st.metric("Résolus", stats["stats_par_statut"].get("total_resolus", 0))
    with col4:
        st.metric("Fermés", stats["stats_par_statut"].get("total_fermes", 0))
    

    if "temps_moyen_par_technicien" in stats:
        st.subheader("Temps moyen de résolution par technicien")
        
        tech_data = stats["temps_moyen_par_technicien"]
        if tech_data:
            df_tech = pd.DataFrame(tech_data)
            df_tech["id_technicien"] = df_tech["id_technicien"].astype(str)
            df_tech["temps_moyen_heures"] = df_tech["temps_moyen_heures"].astype(float)
            df_tech = df_tech.rename(columns={
                "id_technicien": "Technicien",
                "temps_moyen_heures": "Temps moyen (h)"
            })
            st.bar_chart(df_tech.set_index("Technicien")["Temps moyen (h)"])
        else:
            st.info("Aucune donnée disponible sur le temps de résolution.")

    
    if "tickets_par_priorite" in stats:
        st.subheader("Répartition des tickets par priorité")
        
        priority_data = stats["tickets_par_priorite"]
        if priority_data:
            df_priority = pd.DataFrame(priority_data)
            st.pie_chart(df_priority.set_index("priorité")["nombre"])
        else:
            st.info("Aucune donnée disponible sur la répartition des priorités.")
