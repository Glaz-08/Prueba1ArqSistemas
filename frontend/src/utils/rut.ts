export const RUT_MAX_LENGTH = 12;

export function validarRut(valor: string): boolean {
  const limpio = valor.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
  const guion = limpio.lastIndexOf("-");

  let cuerpo: string;
  let dv: string;
  if (guion !== -1) {
    cuerpo = limpio.slice(0, guion);
    dv = limpio.slice(guion + 1);
  } else if (limpio.length >= 8) {
    cuerpo = limpio.slice(0, -1);
    dv = limpio.slice(-1);
  } else {
    return false;
  }

  if (!/^\d+$/.test(cuerpo) || cuerpo.length < 7 || dv.length !== 1) {
    return false;
  }

  const factores = [2, 3, 4, 5, 6, 7];
  const invertido = cuerpo.split("").reverse();
  let total = 0;
  for (let i = 0; i < invertido.length; i++) {
    total += Number(invertido[i]) * factores[i % 6];
  }
  const resto = 11 - (total % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);

  return dv === esperado;
}
