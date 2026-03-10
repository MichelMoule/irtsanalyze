// Script pour créer une campagne par défaut et migrer les candidats existants
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCampaign() {
  try {
    console.log('🌱 Démarrage du seed de la campagne...');

    // Vérifier si une campagne 2024 existe déjà
    let campagne2024 = await prisma.campagne.findUnique({
      where: { annee: 2024 },
    });

    if (!campagne2024) {
      // Créer la campagne 2024-2025
      campagne2024 = await prisma.campagne.create({
        data: {
          annee: 2024,
          libelle: 'Campagne 2024-2025',
          description: 'Campagne d\'admission IRTS 2024-2025',
          statut: 'en_cours',
          dateDebut: new Date('2024-09-01'),
          dateFin: new Date('2025-08-31'),
        },
      });
      console.log('✅ Campagne 2024-2025 créée:', campagne2024.id);
    } else {
      console.log('✅ Campagne 2024-2025 existe déjà:', campagne2024.id);
    }

    // Compter les candidats sans campagne
    const candidatsSansCampagne = await prisma.candidat.count({
      where: { campagneId: null },
    });

    if (candidatsSansCampagne > 0) {
      console.log(`📊 Migration de ${candidatsSansCampagne} candidats vers la campagne 2024...`);

      // Associer tous les candidats sans campagne à la campagne 2024
      const result = await prisma.candidat.updateMany({
        where: { campagneId: null },
        data: { campagneId: campagne2024.id },
      });

      console.log(`✅ ${result.count} candidats migrés vers la campagne 2024-2025`);
    } else {
      console.log('✅ Tous les candidats sont déjà associés à une campagne');
    }

    // Afficher les statistiques
    const totalCandidats = await prisma.candidat.count();
    const campagnes = await prisma.campagne.findMany({
      include: {
        _count: {
          select: { candidats: true },
        },
      },
    });

    console.log('\n📈 Statistiques:');
    console.log(`   Total candidats: ${totalCandidats}`);
    console.log('\n   Campagnes:');
    campagnes.forEach((c) => {
      console.log(`   - ${c.libelle} (${c.annee}): ${c._count.candidats} candidats - ${c.statut}`);
    });

    console.log('\n✅ Seed terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCampaign()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
