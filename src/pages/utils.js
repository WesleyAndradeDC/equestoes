// Utility function to create page URLs
export function createPageUrl(pageName) {
  // Convert page name to URL path (lowercase)
  // Example: 'Home' -> '/', 'Questions' -> '/questions'
  if (pageName === 'Home' || !pageName) {
    return '/';
  }
  return `/${pageName.toLowerCase()}`;
}




