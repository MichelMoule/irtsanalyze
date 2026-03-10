/**
 * Script de démarrage du POC IRTS
 * Charge les données réelles depuis le fichier JSON et initialise l'application
 */

import { Candidat } from '@/types';
import { ImportService } from '@/services/importService';
import { AnalyseurCandidatService } from '@/services/analyseurCandidat';

// Données simulées pour la démo (en attendant le vrai fichier JSON)
const donneesDemo = {
  candidats: [
    {
      DonneesCandidats: {
        NumeroDossier: 'P240001',
        Nom: 'Martin',
        Prenom: 'Sophie',
        DateNaissance: '2006-03-15',
        Email: 'sophie.martin@email.com',
        Telephone: '0612345678'
      },
      Scolarite: {
        Etablissement: 'Lycée Henri IV - Paris',
        Bulletins: [
          {
            Periode: 'Trimestre 1',
            Matieres: [
              { Nom: 'Français', Note: '16/20' },
              { Nom: 'Philosophie', Note: '15/20' },
              { Nom: 'Histoire-Géographie', Note: '14/20' },
              { Nom: 'Mathématiques', Note: '13/20' },
            ]
          },
          {
            Periode: 'Trimestre 2',
            Matieres: [
              { Nom: 'Français', Note: '17/20' },
              { Nom: 'Philosophie', Note: '16/20' },
              { Nom: 'Histoire-Géographie', Note: '15/20' },
              { Nom: 'Mathématiques', Note: '14/20' },
            ]
          }
        ]
      },
      Baccalaureat: {
        Serie: 'Générale',
        Mention: 'Bien'
      },
      Motivations: {
        Lettre: "Je suis profondément motivée par le métier d'éducateur spécialisé. Mon expérience de bénévolat auprès d'enfants en difficulté m'a ouvert les yeux sur l'importance de l'accompagnement social."
      },
      Experiences: [
        {
          Type: 'Bénévolat',
          Description: 'Accompagnement d\'enfants autistes',
          Duree: '6 mois'
        }
      ]
    },
    {
      DonneesCandidats: {
        NumeroDossier: 'P240002',
        Nom: 'Bernard',
        Prenom: 'Lucas',
        DateNaissance: '2005-08-22',
        Email: 'lucas.bernard@email.com',
        Telephone: '0623456789'
      },
      Scolarite: {
        Etablissement: 'Lycée Louis-le-Grand - Paris',
        Bulletins: [
          {
            Periode: 'Trimestre 1',
            Matieres: [
              { Nom: 'Français', Note: '12/20' },
              { Nom: 'Philosophie', Note: '11/20' },
              { Nom: 'Histoire-Géographie', Note: '13/20' },
              { Nom: 'Mathématiques', Note: '10/20' },
            ]
          },
          {
            Periode: 'Trimestre 2',
            Matieres: [
              { Nom: 'Français', Note: '14/20' },
              { Nom: 'Philosophie', Note: '13/20' },
              { Nom: 'Histoire-Géographie', Note: '15/20' },
              { Nom: 'Mathématiques', Note: '12/20' },
            ]
          }
        ]
      },
      Baccalaureat: {
        Serie: 'Générale',
        Mention: 'Assez Bien'
      },
      Motivations: {
        Lettre: "Mon parcours personnel m'a conduit à m'intéresser au travail social. Je souhaite aider les personnes en difficulté et contribuer positivement à la société."
      },
      Experiences: [
        {
          Type: 'Stage',
          Description: 'Assistant animateur en centre de loisirs',
          Duree: '1 mois'
        }
      ]
    },
    {
      DonneesCandidats: {
        NumeroDossier: 'P240003',
        Nom: 'Dubois',
        Prenom: 'Emma',
        DateNaissance: '2006-01-10',
        Email: 'emma.dubois@email.com',
        Telephone: '0634567890'
      },
      Scolarite: {
        Etablissement: 'Lycée Fénelon - Paris',
        Bulletins: [
          {
            Periode: 'Trimestre 1',
            Matieres: [
              { Nom: 'Français', Note: '18/20' },
              { Nom: 'Philosophie', Note: '17/20' },
              { Nom: 'Histoire-Géographie', Note: '16/20' },
              { Nom: 'Mathématiques', Note: '15/20' },
            ]
          },
          {
            Periode: 'Trimestre 2',
            Matieres: [
              { Nom: 'Français', Note: '19/20' },
              { Nom: 'Philosophie', Note: '18/20' },
              { Nom: 'Histoire-Géographie', Note: '17/20' },
              { Nom: 'Mathématiques', Note: '16/20' },
            ]
          }
        ]
      },
      Baccalaureat: {
        Serie: 'Générale',
        Mention: 'Très Bien'
      },
      Motivations: {
        Lettre: "Excellente élève motivée par l'aide aux autres. J'ai participé à de nombreuses actions de bénévolat et souhaite faire carrière dans le social."
      },
      Experiences: [
        {
          Type: 'Bénévolat',
          Description: 'Soutien scolaire pour enfants défavorisés',
          Duree: '1 an'
        },
        {
          Type: 'Engagement',
          Description: 'Présidente de l\'association humanitaire du lycée',
          Duree: '2 ans'
        }
      ]
    }
  ]
};

/**
 * Charge les données de démonstration et les analyse
 */
export async function chargerDonneesDemo(): Promise<Candidat[]> {
  try {
    // Importer les données
    let candidats = await ImportService.importerDonneesParcoursup(donneesDemo);

    // Analyser chaque candidat avec l'IA
    candidats = candidats.map(candidat => {
      const analyse = AnalyseurCandidatService.analyserCandidat(candidat);
      return {
        ...candidat,
        ...analyse
      };
    });

    console.log('✅ Données demo chargées:', candidats.length, 'candidats');
    console.log('📊 Statistiques:', {
      total: candidats.length,
      moyenneIA: candidats.reduce((sum, c) => sum + c.cotationIAProposee, 0) / candidats.length
    });

    return candidats;

  } catch (error) {
    console.error('❌ Erreur lors du chargement des données demo:', error);
    return [];
  }
}

/**
 * Charger les données réelles depuis le fichier JSON
 */
export async function chargerDonneesReelles(cheminFichier: string): Promise<Candidat[]> {
  try {
    // Simulation du chargement du fichier
    // Dans la vraie app, on utiliserait fetch() ou File API
    console.log('📁 Chargement des données depuis:', cheminFichier);
    
    // Pour l'instant, on retourne les données demo
    return await chargerDonneesDemo();

  } catch (error) {
    console.error('❌ Erreur lors du chargement des données réelles:', error);
    return await chargerDonneesDemo(); // Fallback sur les données demo
  }
}