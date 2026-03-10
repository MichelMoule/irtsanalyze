import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // Créer une campagne par défaut
  const campagne = await prisma.campagne.upsert({
    where: { annee: 2025 },
    update: {},
    create: {
      annee: 2025,
      nom: 'Parcoursup 2025',
      libelle: 'Campagne Parcoursup 2025',
      description: 'Campagne d\'admission Parcoursup pour l\'année 2025',
      statut: 'en_cours',
      dateDebut: new Date('2025-01-15'),
      dateFin: new Date('2025-07-31'),
    },
  });

  console.log('✅ Campagne créée:', campagne.nom);

  // Créer un utilisateur administrateur (optionnel)
  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@irts.fr' },
    update: {},
    create: {
      email: 'admin@irts.fr',
      nom: 'Admin',
      prenom: 'IRTS',
      role: 'administrateur',
      estActif: true,
    },
  });

  console.log('✅ Utilisateur admin créé:', admin.email);

  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
