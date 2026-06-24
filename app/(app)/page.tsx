import { redirect } from 'next/navigation'

/* Raíz del front UE → login (acceso vía QR). Tras autenticar, el flujo va al dashboard. */
export default function Home() {
  redirect('/login')
}
