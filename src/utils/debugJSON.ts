/**
 * Debug la structure du fichier JSON réel
 */
export function debugStructureJSON(jsonData: any) {
  console.log('🔍 Debug structure JSON:');
  console.log('- Type:', typeof jsonData);
  console.log('- Est tableau:', Array.isArray(jsonData));
  
  if (Array.isArray(jsonData)) {
    console.log('- Nombre d\'éléments:', jsonData.length);
    if (jsonData.length > 0) {
      console.log('- Premier élément:', {
        type: typeof jsonData[0],
        hasDonneesCandidats: !!jsonData[0].DonneesCandidats,
        hasScolarite: !!jsonData[0].Scolarite,
        hasBaccalaureat: !!jsonData[0].Baccalaureat,
        hasActivitesCentresInteret: !!jsonData[0].ActivitesCentresInteret
      });
    }
  } else {
    console.log('- Clés:', Object.keys(jsonData));
    console.log('- Structure:', JSON.stringify(jsonData, null, 2).substring(0, 500));
  }
}