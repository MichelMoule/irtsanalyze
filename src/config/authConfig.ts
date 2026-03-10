/**
 * Configuration MSAL pour l'authentification Microsoft Azure AD
 *
 * IMPORTANT: Les valeurs ci-dessous sont des exemples.
 * Remplacez-les par vos propres valeurs Azure AD.
 */

export const msalConfig = {
  auth: {
    // TODO: Remplacer par votre Client ID Azure AD
    clientId: process.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',

    // TODO: Remplacer par votre Tenant ID Azure AD
    // Format: https://login.microsoftonline.com/{tenant-id}
    authority: process.env.VITE_AZURE_AUTHORITY || 'https://login.microsoftonline.com/YOUR_TENANT_ID',

    // URL de redirection après connexion
    redirectUri: process.env.VITE_AZURE_REDIRECT_URI || window.location.origin,

    // URL de redirection après déconnexion
    postLogoutRedirectUri: window.location.origin,

    // Navigateur uniquement (pas de popup)
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage' as const, // Ou 'sessionStorage'
    storeAuthStateInCookie: false, // Mettre à true si support IE11
  },
};

/**
 * Scopes demandés lors de la connexion
 */
export const loginRequest = {
  scopes: [
    'User.Read', // Lire le profil utilisateur
    'openid',
    'profile',
    'email',
  ],
};

/**
 * Scopes pour accéder à l'API backend
 */
export const apiRequest = {
  scopes: [
    // TODO: Ajouter les scopes de votre API si nécessaire
    // Format: "api://{client-id}/access_as_user"
  ],
};

/**
 * Configuration des endpoints protégés
 */
export const protectedResources = {
  apiIRTS: {
    endpoint: process.env.VITE_API_URL || 'http://localhost:3001/api',
    scopes: apiRequest.scopes,
  },
};
