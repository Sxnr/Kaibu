// Mensajes claros para errores de Supabase Auth.
/** Traduce errores comunes de Supabase Auth a mensajes claros. */
export function mensajeErrorAuth(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  if (/invalid login credentials/i.test(msg)) return 'El correo o la contraseña no coinciden. Revisa e intenta de nuevo.'
  if (/email not confirmed/i.test(msg)) return 'Falta confirmar tu correo. Revisa tu bandeja de entrada (y spam).'
  if (/already registered|already exists/i.test(msg)) return 'Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.'
  if (/rate limit|too many/i.test(msg)) return 'Hiciste muchos intentos seguidos. Espera un minuto e intenta de nuevo.'
  if (/password/i.test(msg) && /weak|short|least/i.test(msg)) return 'La contraseña es muy débil. Usa al menos 8 caracteres.'
  if (/network|fetch/i.test(msg)) return 'No hay conexión. Revisa tu internet e intenta de nuevo.'
  return 'Algo salió mal. Intenta de nuevo en unos segundos.'
}
