export const canAccessAdmin = (user) => Boolean(user && !user.isAnonymous);
