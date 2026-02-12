import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes da Reserva | Nomadia',
  description: 'Veja os detalhes da sua reserva no Nomadia.',
};

export default function BookingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
