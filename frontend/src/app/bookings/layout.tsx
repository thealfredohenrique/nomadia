import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minhas Reservas | Nomadia',
  description: 'Gerencie suas reservas no Nomadia.',
};

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
