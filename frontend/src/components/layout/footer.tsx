import { Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-rose-500" />
              <span className="font-bold text-rose-500">Nomadia</span>
            </div>
            <p className="text-sm text-gray-500">
              Encontre acomodações únicas em todo o Brasil.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Descubra</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Apartamentos</li>
              <li>Casas</li>
              <li>Chalés e Cabanas</li>
              <li>Quartos</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Destinos Populares</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Rio de Janeiro</li>
              <li>São Paulo</li>
              <li>Florianópolis</li>
              <li>Gramado</li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-sm text-gray-400">
          © 2026 Nomadia. MVP com dados mockados.
        </p>
      </div>
    </footer>
  );
}
