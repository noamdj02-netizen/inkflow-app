import React from 'react';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import type { Database } from '../../types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  flashs?: {
    title: string;
  } | null;
  projects?: {
    body_part: string;
    style: string;
  } | null;
};

type Artist = Database['public']['Tables']['artists']['Row'];

interface InvoiceButtonProps {
  booking: Booking;
  artist: Artist;
}

export const InvoiceButton: React.FC<InvoiceButtonProps> = ({ booking, artist }) => {
  const generateInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Couleurs
    const primaryColor = [251, 191, 36]; // Amber
    const textColor = [15, 23, 42]; // Slate 900
    const lightText = [100, 116, 139]; // Slate 500

    // Header avec logo
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INKFLOW', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Reçu d\'Acompte', pageWidth - 20, 25, { align: 'right' });

    yPos = 50;

    // Informations Artiste
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Artiste:', 20, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(artist.nom_studio || 'Artiste', 20, yPos);
    
    if (artist.bio_instagram) {
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(...lightText);
      doc.text(artist.bio_instagram, 20, yPos);
    }

    yPos += 15;

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Informations Client
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('Client:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(booking.client_name || 'Non renseigné', 20, yPos);
    yPos += 6;
    doc.text(booking.client_email, 20, yPos);
    if (booking.client_phone) {
      yPos += 6;
      doc.text(booking.client_phone, 20, yPos);
    }

    yPos += 15;

    // Détails de la réservation
    doc.setFont('helvetica', 'bold');
    doc.text('Détails de la réservation:', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const bookingDate = new Date(booking.date_debut);
    const dateStr = bookingDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    yPos += 6;
    doc.text(`Date: ${dateStr}`, 20, yPos);
    yPos += 6;
    doc.text(`Durée: ${booking.duree_minutes} minutes`, 20, yPos);
    yPos += 6;
    
    if (booking.flashs) {
      doc.text(`Flash: ${booking.flashs.title}`, 20, yPos);
    } else if (booking.projects) {
      doc.text(`Projet: ${booking.projects.body_part} • ${booking.projects.style}`, 20, yPos);
    }

    yPos += 15;

    // Ligne de séparation
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Montants
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Montants:', 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const totalAmount = Math.round(booking.prix_total / 100);
    const depositAmount = Math.round(booking.deposit_amount / 100);
    const remainingAmount = totalAmount - depositAmount;

    yPos += 7;
    doc.text(`Total: ${totalAmount}€`, 20, yPos);
    yPos += 7;
    doc.text(`Acompte (${booking.deposit_percentage}%): ${depositAmount}€`, 20, yPos);
    yPos += 7;
    doc.text(`Reste à payer: ${remainingAmount}€`, 20, yPos);

    yPos += 15;

    // Encadré pour l'acompte
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(20, yPos, pageWidth - 40, 20);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`Acompte payé: ${depositAmount}€`, 25, yPos + 12);

    yPos += 30;

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('Payé via Stripe', 20, yPos);
    doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos + 5);
    doc.text('InkFlow SaaS - Reçu généré automatiquement', pageWidth - 20, yPos + 5, { align: 'right' });

    // Ouvrir le PDF dans un nouvel onglet
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    // Nettoyer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
  };

  return (
    <button
      onClick={generateInvoice}
      className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
      title="Générer le reçu d'acompte"
    >
      <FileText size={16} />
      <span className="hidden sm:inline">Reçu PDF</span>
      <Download size={14} className="sm:hidden" />
    </button>
  );
};

