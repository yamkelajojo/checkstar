import type { Metadata } from 'next'
import RecipeDetailClient from './RecipeDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Checkstar Recipes` }
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  return <RecipeDetailClient slug={slug} />
}
