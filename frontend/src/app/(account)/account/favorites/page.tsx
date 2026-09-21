import type { Metadata } from 'next'
import FavoritesClient from './FavoritesClient'
export const metadata: Metadata = { title: 'Favorites | Checkstar', description: 'Your favorite products' }
export default function FavoritesPage() { return <FavoritesClient /> }
