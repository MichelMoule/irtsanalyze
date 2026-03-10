// Service d'analyse des candidatures
// Dans une vraie application, ceci ferait appel à Azure OpenAI ou Mistral

interface CandidatData {
  nom: string;
  prenom: string;
  moyenneGenerale: number;
  moyenneFrancais?: number;
  moyenneHistoireGeo?: number;
  moyennePhilosophie?: number;
  moyenneMaths?: number;
  evolution?: string;
  appreciations?: string[];
  activites?: string[];
  absences?: number;
}

interface AnalysisResult {
  synthese: string;
  motsClesPositifs: string[];
  motsClesNegatifs: string[];
  alertes: string[];
  elementsValorisants: string[];
  cotation: number;
}

export function parseParcoursupJSON(data: any): any[] {
  // Handle different JSON structures
  if (Array.isArray(data)) {
    return data;
  }
  if (data.candidats && Array.isArray(data.candidats)) {
    return data.candidats;
  }
  if (data.dossiers && Array.isArray(data.dossiers)) {
    return data.dossiers;
  }
  return [];
}

export async function analyzeCandidat(data: CandidatData): Promise<AnalysisResult> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const motsClesPositifs: string[] = [];
  const motsClesNegatifs: string[] = [];
  const alertes: string[] = [];
  const elementsValorisants: string[] = [];

  // Analyze moyenne
  if (data.moyenneGenerale >= 14) {
    motsClesPositifs.push('excellent niveau', 'résultats solides');
  } else if (data.moyenneGenerale >= 12) {
    motsClesPositifs.push('bon niveau', 'résultats satisfaisants');
  } else if (data.moyenneGenerale >= 10) {
    motsClesPositifs.push('niveau correct');
  } else {
    motsClesNegatifs.push('résultats faibles');
    alertes.push('Moyenne générale inférieure à 10/20');
  }

  // Analyze evolution
  if (data.evolution === 'progression') {
    motsClesPositifs.push('en progression', 'dynamique positive');
  } else if (data.evolution === 'regression') {
    motsClesNegatifs.push('baisse des résultats');
    alertes.push('Baisse significative des résultats');
  }

  // Analyze absences
  if (data.absences && data.absences > 10) {
    motsClesNegatifs.push('absences répétées');
    alertes.push(`Absences répétées signalées (${data.absences} demi-journées)`);
  }

  // Analyze appreciations (simulation)
  if (data.appreciations && data.appreciations.length > 0) {
    const appreciationsText = data.appreciations.join(' ').toLowerCase();

    // Positive keywords
    const positiveKeywords = [
      'sérieux',
      'impliqué',
      'motivé',
      'curieux',
      'participation',
      'travail',
      'autonome',
      'rigoureux',
    ];
    positiveKeywords.forEach((keyword) => {
      if (appreciationsText.includes(keyword)) {
        motsClesPositifs.push(keyword);
      }
    });

    // Negative keywords
    const negativeKeywords = [
      'passif',
      'absent',
      'difficulté',
      'manque',
      'insuffisant',
      'faible',
    ];
    negativeKeywords.forEach((keyword) => {
      if (appreciationsText.includes(keyword)) {
        motsClesNegatifs.push(keyword);
        if (keyword === 'absent' || keyword === 'absences') {
          alertes.push('Absences mentionnées dans les appréciations');
        }
      }
    });
  }

  // Analyze activities
  if (data.activites && data.activites.length > 0) {
    data.activites.forEach((activite) => {
      const activiteLower = activite.toLowerCase();
      if (activiteLower.includes('bafa')) elementsValorisants.push('BAFA');
      if (activiteLower.includes('psc1')) elementsValorisants.push('PSC1');
      if (activiteLower.includes('bénévolat')) elementsValorisants.push('Bénévolat');
      if (activiteLower.includes('stage')) elementsValorisants.push('Stage en milieu social');
      if (activiteLower.includes('tutorat')) elementsValorisants.push('Tutorat');
    });
  }

  // Generate synthese
  let synthese = generateSynthese(data, motsClesPositifs, motsClesNegatifs);

  // Calculate cotation
  let cotation = calculateCotation(data, motsClesPositifs, motsClesNegatifs, elementsValorisants);

  return {
    synthese,
    motsClesPositifs: [...new Set(motsClesPositifs)], // Remove duplicates
    motsClesNegatifs: [...new Set(motsClesNegatifs)],
    alertes: [...new Set(alertes)],
    elementsValorisants: [...new Set(elementsValorisants)],
    cotation,
  };
}

function generateSynthese(
  data: CandidatData,
  positifs: string[],
  negatifs: string[]
): string {
  const parts: string[] = [];

  // Niveau scolaire
  if (data.moyenneGenerale >= 14) {
    parts.push(
      `Excellent profil avec une moyenne générale de ${data.moyenneGenerale.toFixed(1)}/20.`
    );
  } else if (data.moyenneGenerale >= 12) {
    parts.push(
      `Bon profil avec une moyenne générale de ${data.moyenneGenerale.toFixed(1)}/20.`
    );
  } else if (data.moyenneGenerale >= 10) {
    parts.push(
      `Résultats corrects avec une moyenne générale de ${data.moyenneGenerale.toFixed(1)}/20.`
    );
  } else {
    parts.push(
      `Résultats fragiles avec une moyenne générale de ${data.moyenneGenerale.toFixed(1)}/20.`
    );
  }

  // Evolution
  if (data.evolution === 'progression') {
    parts.push('Progression constante témoignant d\'un investissement croissant.');
  } else if (data.evolution === 'stable') {
    parts.push('Résultats stables démontrant une régularité.');
  } else if (data.evolution === 'regression') {
    parts.push('Baisse des résultats nécessitant une vigilance particulière.');
  }

  // Points d'attention
  if (negatifs.length > 0) {
    parts.push(`Points d'attention : ${negatifs.slice(0, 2).join(', ')}.`);
  }

  // Points forts
  if (positifs.length > 0) {
    parts.push(`Points forts : ${positifs.slice(0, 3).join(', ')}.`);
  }

  return parts.join(' ');
}

function calculateCotation(
  data: CandidatData,
  positifs: string[],
  negatifs: string[],
  valorisants: string[]
): number {
  let score = 0;

  // Base score from moyenne (0-4 points)
  if (data.moyenneGenerale >= 15) score += 4;
  else if (data.moyenneGenerale >= 13) score += 3.5;
  else if (data.moyenneGenerale >= 11) score += 3;
  else if (data.moyenneGenerale >= 10) score += 2.5;
  else if (data.moyenneGenerale >= 9) score += 2;
  else score += 1;

  // Evolution bonus/malus (0-1 point)
  if (data.evolution === 'progression') score += 1;
  else if (data.evolution === 'stable') score += 0.5;
  else if (data.evolution === 'regression') score -= 0.5;

  // Positifs bonus (0-2 points)
  score += Math.min(positifs.length * 0.2, 2);

  // Negatifs malus (0-2 points)
  score -= Math.min(negatifs.length * 0.3, 2);

  // Valorisants bonus (0-1 point)
  score += Math.min(valorisants.length * 0.25, 1);

  // Ensure score is between 0 and 8
  score = Math.max(0, Math.min(8, score));

  // Round to nearest 0.5
  return Math.round(score * 2) / 2;
}
