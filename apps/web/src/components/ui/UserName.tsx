interface UserNameProps {
  nombre: string;
  /** Soft-deleted user. Accepts boolean or 0/1 from MySQL (sometimes as string from MySQLi driver). */
  inactivo?: boolean | number | string | null;
  className?: string;
}

// Coerción robusta: maneja 1, "1", true. Trata "0" (string MySQLi) como false (Boolean("0") sería true).
function isInactivoFlag(v: boolean | number | string | null | undefined): boolean {
  return v === true || v === 1 || v === '1';
}

export default function UserName({ nombre, inactivo, className = '' }: UserNameProps) {
  const isInactivo = isInactivoFlag(inactivo);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {nombre}
      {isInactivo && (
        <span
          className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-3"
          title="Esta cuenta fue dada de baja"
        >
          Inactivo
        </span>
      )}
    </span>
  );
}
