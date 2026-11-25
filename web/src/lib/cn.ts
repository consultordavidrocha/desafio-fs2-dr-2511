import { clsx, type ClassValue } from 'clsx'

/** Junta classes condicionalmente (atalho para clsx). */
export const cn = (...classes: ClassValue[]): string => clsx(classes)
