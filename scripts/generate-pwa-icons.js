/**
 * Script pour générer les icônes PWA à partir de icon.png
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Nécessite: npm install sharp --save-dev
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../public/icon.png');
const outputDir = path.join(__dirname, '../public');

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
];

async function generateIcons() {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Fichier source introuvable: ${inputFile}`);
    console.log('💡 Assurez-vous que icon.png est dans le dossier public/');
    process.exit(1);
  }

  console.log(`📸 Génération des icônes PWA depuis ${inputFile}...\n`);

  for (const { size, name } of sizes) {
    try {
      const outputPath = path.join(outputDir, name);
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fond transparent
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size}) généré`);
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de ${name}:`, error.message);
    }
  }

  console.log('\n✨ Icônes PWA générées avec succès!');
}

generateIcons().catch(console.error);
