import { Compass } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import PillLink from '@/components/ui/PillLink';
import EmptyState from '@/components/ui/EmptyState';
import IntercambiosSeccion from './components/IntercambiosSeccion';
import { useListarVinculaciones } from './hooks/useVinculaciones';

/** Todo lo que la persona pidió a otras: la mitad "aprender" del intercambio. */
export default function AprendiendoPage() {
  const { data, isLoading } = useListarVinculaciones({ rol: 'buscador', per_page: 1 });
  const sinNada = !isLoading && (data?.meta.total ?? 0) === 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Aprendiendo"
        subtitle="Lo que pediste a otras personas y en qué va cada intercambio."
        actions={
          <PillLink to="/inicio" variant="light">
            <Compass className="h-4 w-4" aria-hidden /> Explorar ofertas
          </PillLink>
        }
      />

      {sinNada ? (
        <EmptyState
          title="Todavía no has pedido nada"
          subtitle="Busca algo que quieras aprender y marca «Me interesa». Aquí verás la respuesta."
          action={{ label: 'Explorar ofertas', to: '/inicio' }}
        />
      ) : (
        <>
          <IntercambiosSeccion
            titulo="En curso"
            papel="aprendiendo"
            estado="aceptada"
            vacio="Cuando alguien acepte tu solicitud, el intercambio aparece aquí con su chat."
          />
          <IntercambiosSeccion titulo="Esperando respuesta" papel="aprendiendo" estado="solicitada" />
          <IntercambiosSeccion titulo="Terminados" papel="aprendiendo" estado="completada,rechazada,cancelada" limite={4} />
        </>
      )}
    </div>
  );
}
