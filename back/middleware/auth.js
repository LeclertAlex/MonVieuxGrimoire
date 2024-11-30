const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Log du secret JWT pour vérification
    console.log("JWT Secret dans middleware/auth:", process.env.JWT_SECRET);
    
    // Vérifie que l'en-tête Authorization est présent
    if (!req.headers.authorization) {
      console.error("Erreur : en-tête Authorization manquant");
      return res.status(401).json({ message: 'Requête non authentifiée - en-tête manquant' });
    }

    // Extraction du token à partir de l'en-tête Authorization
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      console.error("Erreur : Token manquant dans l'en-tête Authorization");
      return res.status(401).json({ message: 'Requête non authentifiée - token manquant' });
    }
    console.log("Token extrait :", token);

    // Vérification et décodage du token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token décodé :", decodedToken);
    } catch (error) {
      console.error("Erreur lors de la vérification du token :", error.message);
      return res.status(401).json({ message: 'Requête non authentifiée - token invalide' });
    }

    // Ajout de l'ID utilisateur extrait du token à la requête
    req.userId = decodedToken.userId;
    console.log("ID utilisateur extrait du token :", req.userId);

    // Vérifie que l'ID utilisateur est un ObjectId valide (si nécessaire)
    if (!req.userId || typeof req.userId !== 'string') {
      console.error("Erreur : ID utilisateur non valide");
      return res.status(401).json({ message: 'Requête non authentifiée - ID utilisateur non valide' });
    }

    console.log("Type de userId après extraction du token :", typeof req.userId);

    next(); // Poursuit la chaîne de middleware

  } catch (error) {
    // En cas de problème inattendu
    console.error("Erreur dans le middleware d'authentification :", error.message);
    res.status(401).json({ message: 'Requête non authentifiée' });
  }
};
