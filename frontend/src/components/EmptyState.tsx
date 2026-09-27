import type { LucideIcon } from 'lucide-react'

/**
 * The storefront's one empty state.
 *
 * Shape is the contract, and it matches the mobile `EmptyState` and the admin
 * kit's: bare glyph → title (what is missing) → caption (what to do next) →
 * at most one action. Before this, "No orders yet", "No favorites yet",
 * "Nothing here yet — check back soon." and "No products in this sale yet" were
 * four hand-rolled divs with four icon sizes, four paddings and two button
 * labels for the same idea.
 *
 * Deliberately no animation: the surfaces that want a fade already wrap their
 * content in the house motion variants, so this stays plain markup.
 */
interface EmptyStateProps {
  /** Bare glyph, drawn at 1.5 stroke like the mobile equivalent. Optional:
   *  some slots already carry an icon in their heading. */
  icon?: LucideIcon
  /** What is missing. Rendered as a heading so it is navigable. */
  title: string
  /** What to do next. One line. */
  caption?: string
  /** The way forward — a Link or button, styled by the caller. */
  action?: React.ReactNode
  /** Tighter padding for narrow slots (carousels, drawers, side panels). */
  compact?: boolean
  /** 'h1' when this state *is* the page (a sale that no longer exists). */
  heading?: 'h1' | 'h2'
}

export default function EmptyState({
  icon: Icon,
  title,
  caption,
  action,
  compact = false,
  heading = 'h2',
}: EmptyStateProps) {
  const Heading = heading
  return (
    <div className={`${compact ? 'py-10 px-4' : 'py-20 px-6'} text-center`}>
      {Icon ? (
        <Icon
          size={compact ? 32 : 44}
          strokeWidth={1.5}
          aria-hidden="true"
          className="mx-auto text-gray-300 mb-4"
        />
      ) : null}
      <Heading
        className={
          heading === 'h1'
            ? 'font-display text-xl font-bold text-gray-800'
            : 'font-display text-lg font-semibold text-gray-700'
        }
      >
        {title}
      </Heading>
      {caption ? (
        <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">{caption}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
