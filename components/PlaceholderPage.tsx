/**
 * Page placeholder pour Mentions légales / Contact (liens footer).
 * À remplacer par du contenu réel quand les pages seront rédigées.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import { PageSEO } from './seo/PageSEO';
import { Breadcrumbs } from './seo/Breadcrumbs';
import { useBreadcrumbsFromPath } from './seo/Breadcrumbs';

type Props = {
  title: string;
  description: string;
  icon?: 'file' | 'mail';
};

export const PlaceholderPage: React.FC<Props> = ({ title, description, icon = 'file' }) => {
  const Icon = icon === 'mail' ? Mail : FileText;
  const { pathname } = useLocation();
  const breadcrumbItems = useBreadcrumbsFromPath();
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-4">
      <PageSEO title={`${title} | InkFlow`} description={description} canonical={pathname} />
      <div className="max-w-md w-full text-center">
        {breadcrumbItems.length > 0 && (
          <Breadcrumbs items={breadcrumbItems} className="justify-center mb-6" />
        )}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-6">
          <Icon size={32} className="text-zinc-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">{title}</h1>
        <p className="text-zinc-500 mb-8">{description}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
};
