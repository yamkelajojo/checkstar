import type { Metadata } from 'next'
import RecipesClient from './RecipesClient'

export const metadata: Metadata = {
  title: 'Recipes — Checkstar',
  description: 'Browse our collection of recipes made with Checkstar ingredients.',
}

export default function RecipesPage() {
  return <RecipesClient />
}
