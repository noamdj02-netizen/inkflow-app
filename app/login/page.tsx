import type { Metadata } from 'next';
import { LoginPage } from '@/components/LoginPage';

export const metadata: Metadata = {
  title: 'Connexion | InkFlow',
  description: 'Connectez-vous à votre espace InkFlow pour gérer vos réservations, flashs et clients.',
  alternates: {
    canonical: '/login',
  },
};

export default function Login() {
  return <LoginPage />;
}
