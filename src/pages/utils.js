// Utility function to create page URLs
export function createPageUrl(pageName) {
  // Convert page name to URL path
  // Example: 'Home' -> '/', 'Questions' -> '/Questions'
  if (pageName === 'Home') {
    return '/';
  }
  return `/${pageName}`;
}



