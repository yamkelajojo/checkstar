import type { Metadata } from 'next'
import CategoriesClient from './CategoriesClient'
export const metadata: Metadata = { title: 'Categories | Admin', description: 'Manage categories' }
export default function CategoriesPage() { return <CategoriesClient /> }
