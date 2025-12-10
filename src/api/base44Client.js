import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691dc0b12c691c2a21e85c24", 
  requiresAuth: true // Ensure authentication is required for all operations
});
