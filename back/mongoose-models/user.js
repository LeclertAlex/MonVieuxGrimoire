const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email invalide'],
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
  },
  username: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
