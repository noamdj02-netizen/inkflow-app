import type { Metadata } from 'next';
import { RegisterPage } from '@/components/RegisterPage';

export const metadata: Metadata = {
  title: 'Inscription | InkFlow — Créer un compte tatoueur',
  description: 'Créez votre compte InkFlow : gestion de réservations, flashs et paiements pour tatoueurs professionnels.',
  alternates: {
    canonical: '/register',
  },
};

export default function Register() {
  return <RegisterPage />;
}
