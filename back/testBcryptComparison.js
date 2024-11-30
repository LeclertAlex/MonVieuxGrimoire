const bcrypt = require('bcryptjs');

// Mot de passe à tester
const password = 'password123';

// Générer un hachage pour "password123"
bcrypt.hash(password, 10).then(newHash => {
    console.log("Nouveau hachage généré :", newHash);

    // Comparaison directe avec le nouveau hachage généré
    bcrypt.compare(password, newHash).then(result => {
        console.log("Résultat de la comparaison avec le nouveau hachage :", result);
    }).catch(err => {
        console.error("Erreur lors de la comparaison :", err);
    });
}).catch(err => {
    console.error("Erreur lors de la génération du hachage :", err);
});
