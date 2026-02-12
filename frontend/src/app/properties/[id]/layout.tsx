import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes da Propriedade | Nomadia',
  description: 'Veja detalhes, fotos e avaliações desta acomodação no Nomadia.',
};

export default function PropertyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
