require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware pour autoriser les requêtes CORS et JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir les images téléchargées depuis le dossier "uploads"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log("Dossier 'uploads' configuré pour servir les fichiers statiques");

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch((error) => console.error('Erreur de connexion à MongoDB :', error));

// Routes API
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('Bienvenue sur Mon Vieux Grimoire API !');
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
