require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware généraux
app.use(cors()); // Autorise les requêtes CORS
app.use(express.json()); // Parse le JSON des requêtes
app.use(express.urlencoded({ extended: false })); // Parse les données URL-encodées

// Servir les images téléchargées depuis le dossier "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log("Dossier 'uploads' configuré pour servir les fichiers statiques");

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((error) => console.error('Erreur de connexion à MongoDB :', error));

// Routes API
app.use('/api/books', bookRoutes); // Routes pour les livres
app.use('/api/auth', userRoutes); // Routes pour les utilisateurs (signup, login)

// Route de test (facultative)
app.get('/', (req, res) => {
  res.send('Bienvenue sur Mon Vieux Grimoire API !');
});

// Démarrage du serveur avec PORT par défaut à 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});