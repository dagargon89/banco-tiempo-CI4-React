interface UserNameProps {
  nombre: string;
  /** Soft-deleted user. Accepts boolean or 0/1 from MySQL. */
  inactivo?: boolean | number | null;
  className?: string;
}

export default function UserName({ nombre, inactivo, className = '' }: UserNameProps) {
  const isInactivo = Boolean(inactivo);
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
