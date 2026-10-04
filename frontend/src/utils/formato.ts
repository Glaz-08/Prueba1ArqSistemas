export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatoHora(valor: string): string {
  return valor.slice(0, 5);
}

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatoFecha(valor: string): string {
  const [anio, mes, dia] = valor.split("-");
  const indice = Number(mes) - 1;
  if (!anio || !dia || Number.isNaN(indice)) {
    return valor;
  }
  return `${dia} ${MESES_CORTOS[indice] ?? mes} ${anio}`;
}

export function tituloRuta(pathname: string): string {
  if (pathname.startsWith("/registros/nueva")) return "Nueva revisión";
  if (pathname.includes("/copia")) return "Copia imprimible";
  if (pathname.startsWith("/registros/")) return "Detalle";
  if (pathname.startsWith("/consulta")) return "Consulta";
  if (pathname.startsWith("/estadisticas")) return "Estadísticas";
  if (pathname.startsWith("/catalogos/estudiantes")) return "Estudiantes";
  if (pathname.startsWith("/catalogos/funcionarios")) return "Funcionarios";
  if (pathname.startsWith("/admin/usuarios")) return "Usuarios";
  if (pathname.startsWith("/contrasena")) return "Contraseña";
  return "Inicio";
}
