// Images d'exemple pour la section Flashs Disponibles
// Remplacez ces chemins par les vraies images une fois qu'elles sont ajoutées dans public/flashs-examples/

export interface ExampleFlash {
  id: string;
  title: string;
  imageUrl: string;
  price: number; // en centimes
  duration: number; // en minutes
  size: string;
  style: string;
  status?: 'available' | 'sold_out'; // Statut optionnel pour les exemples
}

export const EXAMPLE_FLASHS: ExampleFlash[] = [
  {
    id: 'example-1',
    title: 'Serpent Floral',
    imageUrl: '/flashs-examples/serpent-floral.jpg',
    price: 15000, // 150€
    duration: 120,
    size: '10x5 cm',
    style: 'Fine Line'
  },
  {
    id: 'example-2',
    title: 'Dague Old School',
    imageUrl: '/flashs-examples/dague-old-school.jpg',
    price: 20000, // 200€
    duration: 120,
    size: '15x8 cm',
    style: 'Traditionnel'
  },
  {
    id: 'example-3',
    title: 'Papillon Abstrait',
    imageUrl: '/flashs-examples/papillon-abstrait.jpg',
    price: 12000, // 120€
    duration: 120,
    size: '8x8 cm',
    style: 'Abstrait'
  },
  {
    id: 'example-4',
    title: 'Crâne & Boussole',
    imageUrl: '/flashs-examples/crane-boussole.jpg',
    price: 25000, // 250€ (prix original, mais marqué VENDU)
    duration: 120,
    size: '12x12 cm',
    style: 'Géométrique',
    status: 'sold_out' // Marqué comme VENDU
  },
  {
    id: 'example-5',
    title: 'Rose Réaliste',
    imageUrl: '/flashs-examples/rose-realiste.jpg',
    price: 18000, // 180€
    duration: 120,
    size: '10x10 cm',
    style: 'Réalisme'
  },
  {
    id: 'example-6',
    title: 'Paysage Blackwork',
    imageUrl: '/flashs-examples/paysage-blackwork.jpg',
    price: 14000, // 140€
    duration: 120,
    size: '7x7 cm',
    style: 'Blackwork'
  }
];

