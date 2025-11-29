// names.js
// Liste centralisée des prénoms modernes et uniques
// Chaque couleur aura exactement un prénom unique (pas de répétitions)

export const MODERN_NAMES = [
  'James', 'Gregor', 'Zizi', 'Yuri', 'Gunnar', 'Ananya', 'Asher', 'Francesca', 'Rayan', 'Vincenzo',
  'Iris', 'Takeshi', 'Yasmine', 'Skye', 'Hana', 'Omar', 'Cora', 'Matthias', 'Noor', 'Blake',
  'Akira', 'Rose', 'Julien', 'Phoenix', 'Valeria', 'Isamu', 'Jade', 'Carlos', 'Aurora', 'Corentin',
  'Klaus', 'Anjali', 'Stella', 'Luis', 'Diya', 'Tariq', 'Rowan', 'Emilio', 'Amélie', 'Kai',
  'Juliette', 'Greg', 'Sofia', 'Enzo', 'Tatum', 'Nasira', 'Théo', 'Audrey', 'Rajia', 'Liam',
  'Riccardo', 'Layla', 'Fatima', 'Javier', 'Sasha', 'Thorsten', 'Jamal', 'Yara', 'Raphaël', 'Vidya',
  'Leila', 'Willow', 'Manon', 'Hugo', 'Romane', 'Ivy', 'Aditi', 'Keiko', 'Sergio', 'Hazel',
  'Robin', 'Youssef', 'Olivia', 'Valentin', 'Bella', 'Jasper', 'Raven', 'Rin', 'Angèle', 'Dimitri',
  'Gabriel', 'Chloé', 'Lisa', 'Divya', 'Ever', 'Amina', 'Francesco', 'Akiko', 'Ethan', 'Diego',
  'Maxime', 'Mila', 'Mateo', 'Vladimir', 'Sakura', 'Adel', 'Rohan', 'Helmut', 'Giulia', 'Pablo',
  'Mathieu', 'Samir', 'Nils', 'Storm', 'Adrien', 'Ambre', 'Giancarlo', 'Anlan', 'Marco', 'Alexei',
  'Bryn', 'Kenzo', 'Igor', 'Nova', 'Misaki', 'Scarlett', 'Charlotte', 'Anders', 'Elise', 'Beatrice',
  'Ferdinand', 'Ivette', 'Abel', 'Haruto', 'Quinn', 'Soraya', 'Soren', 'Noa', 'Florian', 'Morgan',
  'Magnus', 'Rafael', 'Mael', 'Chanel', 'Oscar', 'Zara', 'Antoine', 'Nathalie', 'Leo', 'Rishab',
  'Martina', 'Romain', 'Anton', 'River', 'Alexis', 'Hudson', 'Erik', 'Ivan', 'Stefano', 'Wolfgang',
  'Zainab', 'Luna', 'Andres', 'Samuel', 'Dev', 'Arthur', 'Zoe', 'Priya', 'Emiko', 'Naïa',
  'Friedrich', 'Baptiste', 'Riley', 'Gerhard', 'Alexandre', 'Per', 'Freya', 'Ines', 'Tom', 'Alessia',
  'Lucas', 'Mina', 'Pavel', 'Chiara', 'Jérôme', 'Ava', 'Gustav', 'Tomoe', 'Léo-Paul', 'Nathan',
  'Léon', 'Sergei', 'Malik', 'Gunter', 'Kiera', 'Aisha', 'Arjun', 'Kavya', 'Marie', 'Dylan',
  'Charlie', 'Lars', 'Blanca', 'Siya', 'Indigo', 'Mathis', 'Hans', 'Oliver', 'Nikolai', 'Raya',
  'Victor', 'Mika', 'Andreas', 'Neha', 'Noah', 'Sky', 'Sabina', 'Simon', 'Farid', 'Louis',
  'Miguel', 'Felix', 'Jorge', 'Casey', 'Violet', 'Everett', 'Elena', 'Clara', 'Misha', 'Carlos'
];


// Sauvegarder indice => prénom pour éviter les répétitions
let usedIndices = new Set();

export function generateUniqueName(hex, index) {
  // Assurer que chaque indice mappe à un prénom unique
  if (usedIndices.has(index)) {
    // Si déjà utilisé, retourner depuis le cache
    return null; // sera géré en dehors
  }
  usedIndices.add(index);
  return MODERN_NAMES[index % MODERN_NAMES.length];
}

export function resetNameIndices() {
  usedIndices.clear();
}
