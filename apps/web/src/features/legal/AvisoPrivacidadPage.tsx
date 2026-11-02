import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';

export default function AvisoPrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title="Aviso de privacidad" />
      <p className="mb-8 rounded-md border border-warning/30 bg-warning/5 px-4 py-2 text-sm text-warning">
        Borrador técnico — requiere revisión legal antes de su publicación definitiva.
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-text-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">1. Responsable del tratamiento</h2>
          <p>
            Banco de Tiempo — Participa Juarez (en adelante, &quot;la Plataforma&quot;) es responsable del
            tratamiento de los datos personales que usted proporcione, de conformidad con la Ley Federal de
            Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">2. Datos recabados</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Fotografía de perfil (opcional)</li>
            <li>Documento de identidad (para verificación)</li>
            <li>Zona o colonia (opcional)</li>
            <li>Habilidades y descripciones de ofertas publicadas</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">3. Finalidad</h2>
          <p>Los datos recabados se utilizan para:</p>
          <ul className="list-inside list-disc space-y-1 mt-2">
            <li>Crear y administrar su cuenta de usuario.</li>
            <li>Verificar su identidad.</li>
            <li>Facilitar el intercambio de servicios entre usuarios.</li>
            <li>Enviar notificaciones relacionadas con la plataforma.</li>
            <li>Generar estadísticas anónimas de uso.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">4. Derechos ARCO</h2>
          <p>
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos
            personales (derechos ARCO). Para ejercer estos derechos, envie un correo a{' '}
            <span className="font-medium text-accent">privacidad@bancodetiempo.example.com</span>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">5. Transferencia de datos</h2>
          <p>
            Sus datos no seran transferidos a terceros sin su consentimiento, salvo en los casos previstos
            por la ley.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text-1">6. Contacto</h2>
          <p>
            Para cualquier duda o aclaracion sobre este aviso de privacidad, contactenos en{' '}
            <span className="font-medium text-accent">privacidad@bancodetiempo.example.com</span>.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-sm font-medium text-accent hover:text-accent-hover">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
