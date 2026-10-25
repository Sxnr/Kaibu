import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Tarjeta({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-tarjeta border border-borde bg-superficie p-4 shadow-tarjeta sm:p-5', className)} {...props} />
}
