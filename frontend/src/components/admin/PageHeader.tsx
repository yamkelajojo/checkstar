/**
 * Standard admin page header: title + optional count/description + actions.
 * Every admin screen uses this so first-screen hierarchy is identical:
 * what am I on → how much is here → what can I do.
 */
interface PageHeaderProps {
  title: string
  /** One line: e.g. "12 sales" or "Manage the products shown in the catalogue." */
  subtitle?: string
  /** Right-aligned actions (primary "New …" button). */
  actions?: React.ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
