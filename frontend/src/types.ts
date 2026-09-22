export type Estudiante = {
  rut: string;
  nombre: string;
  curso: string;
};

export type Funcionario = {
  id?: string;
  nombre: string;
  cargo: string;
};

export type ElementoEncontrado = {
  id?: string;
  cantidad: number;
  descripcion: string;
  observaciones: string;
};

export type Evidencia = {
  id: string;
  nombre_archivo: string;
  content_type: string;
};

export type Registro = {
  id: string;
  estudiante: Estudiante;
  funcionarios_presentes: Funcionario[];
  motivo: string;
  elementos_encontrados: ElementoEncontrado[];
  fecha: string;
  hora_inicio: string;
  hora_termino: string;
  evidencias: Evidencia[];
  created_at: string;
};

export type RegistroResumen = {
  id: string;
  estudiante_nombre: string;
  estudiante_curso: string;
  motivo: string;
  fecha: string;
  hora_inicio: string;
  hora_termino: string;
};

export type RegistroCreate = {
  estudiante: Estudiante;
  funcionarios_presentes: Omit<Funcionario, "id">[];
  motivo: string;
  elementos_encontrados: Omit<ElementoEncontrado, "id">[];
  fecha: string;
  hora_inicio: string;
  hora_termino: string;
};

export type FiltrosConsulta = {
  estudiante?: string;
  curso?: string;
  motivo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

export type ConteoItem = {
  nombre: string;
  cantidad: number;
};

export type Estadisticas = {
  total: number;
  por_mes: ConteoItem[];
  por_motivo: ConteoItem[];
  por_curso: ConteoItem[];
};
