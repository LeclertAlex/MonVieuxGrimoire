// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../mongoose-models/User'); 

// Inscription de l'utilisateur
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ajout de logs pour déboguer les validations
    console.log("Email reçu :", email);
    console.log("Mot de passe reçu :", password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Validation échouée : email invalide.");
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    if (password.length < 6) {
      console.log("Validation échouée : mot de passe trop court.");
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    console.log("Utilisateur créé :", user);

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    if (error.code === 11000) {
      console.log("Erreur MongoDB : Email dupliqué.");
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }
    console.error("Erreur interne :", error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



// Connexion de l'utilisateur
exports.login = async (req, res) => {
  console.log("login")
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      console.log("Utilisateur non trouvé pour l'email:", req.body.email);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log("Mot de passe reçu pour connexion (login):", req.body.password); // En clair
    console.log("Mot de passe stocké dans la base (login):", user.password);     // Haché

    // Comparaison du mot de passe en clair avec le hachage stocké
    const isValidPassword = await bcrypt.compare(req.body.password, user.password);
    console.log("Résultat de la comparaison avec bcrypt (login):", isValidPassword);

    if (!isValidPassword) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Génération du token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log(user.id) 
    console.log(token) 
    res.status(200).json({ userId: user._id, token });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: error.message });
  }
};

