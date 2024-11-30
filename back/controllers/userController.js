// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../mongoose-models/User'); 

// Inscription de l'utilisateur
exports.signup = async (req, res) => {
  try {
    const plainPassword = req.body.password;
    console.log("Mot de passe avant le hachage (signup):", plainPassword);

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log("Mot de passe haché (signup):", hashedPassword);

    // Création et sauvegarde de l'utilisateur avec le hachage
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    res.status(400).json({ message: error.message });
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

