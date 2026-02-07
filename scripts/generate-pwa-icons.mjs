/**
 * Script pour générer les icônes PWA à partir de icon.png
 * 
 * Usage: node scripts/generate-pwa-icons.mjs
 * 
 * Ce script utilise le module natif 'sharp' s'il est disponible,
 * sinon il copie simplement icon.png vers les fichiers PWA.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, '../public/icon.png');
const outputDir = join(__dirname, '../public');

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
];

async function generateIcons() {
  if (!existsSync(inputFile)) {
    console.error(`❌ Fichier source introuvable: ${inputFile}`);
    console.log('💡 Assurez-vous que icon.png est dans le dossier public/');
    process.exit(1);
  }

  console.log(`📸 Génération des icônes PWA depuis ${inputFile}...\n`);

  // Essayer d'utiliser sharp si disponible
  try {
    const sharp = (await import('sharp')).default;
    
    for (const { size, name } of sizes) {
      const outputPath = join(outputDir, name);
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fond transparent
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size}) généré avec sharp`);
    }
    
    console.log('\n✨ Icônes PWA générées avec succès!');
  } catch (error) {
    // Si sharp n'est pas disponible, copier simplement icon.png
    console.log('⚠️  Sharp non disponible, copie directe de icon.png...\n');
    
    const iconData = readFileSync(inputFile);
    
    for (const { size, name } of sizes) {
      const outputPath = join(outputDir, name);
      writeFileSync(outputPath, iconData);
      console.log(`✅ ${name} copié depuis icon.png`);
      console.log(`   ⚠️  Assurez-vous que icon.png fait ${size}x${size}px pour un résultat optimal`);
    }
    
    console.log('\n✨ Icônes PWA copiées!');
    console.log('💡 Pour générer les bonnes tailles, installez sharp: npm install sharp --save-dev');
  }
}

generateIcons().catch(console.error);
