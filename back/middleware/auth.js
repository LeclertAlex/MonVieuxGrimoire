const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Vérifie que la clé secrète JWT est définie
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET n'est pas défini dans les variables d'environnement");
    }
    console.log("JWT Secret utilisé :", process.env.JWT_SECRET);

    // Vérifie que l'en-tête Authorization est présent
    if (!req.headers.authorization) {
      console.error("Erreur : en-tête Authorization manquant");
      return res.status(401).json({ message: 'Requête non authentifiée - en-tête Authorization manquant' });
    }

    // Vérifie que l'en-tête Authorization contient "Bearer"
    if (!req.headers.authorization.startsWith('Bearer ')) {
      console.error("Erreur : Token mal formé dans l'en-tête Authorization");
      return res.status(401).json({ message: 'Requête non authentifiée - token mal formé' });
    }

    // Extraction du token depuis l'en-tête Authorization
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      console.error("Erreur : Token non fourni");
      return res.status(401).json({ message: 'Requête non authentifiée - token non fourni' });
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

    // Ajout de l'ID utilisateur extrait du token à l'objet req
    req.userId = decodedToken.userId;
    if (!req.userId || typeof req.userId !== 'string') {
      console.error("Erreur : ID utilisateur extrait non valide");
      return res.status(401).json({ message: 'Requête non authentifiée - ID utilisateur invalide' });
    }

    console.log("ID utilisateur validé :", req.userId);

    // Passe au middleware suivant
    next();
  } catch (error) {
    console.error("Erreur dans le middleware d'authentification :", error.message);
    res.status(401).json({ message: 'Requête non authentifiée' });
  }
};
