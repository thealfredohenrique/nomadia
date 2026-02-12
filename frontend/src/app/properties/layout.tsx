import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acomodações | Nomadia',
  description: 'Encontre acomodações únicas em todo o Brasil.',
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
