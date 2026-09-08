const LOADER_CSS = `
.checkstar-text {
  font-family: var(--font-inter, 'Inter'), system-ui, sans-serif;
  font-size: 24px;
  fill: rgba(235,101,34,0);
  stroke: #EB6522;
  stroke-width: 2;
  stroke-dashoffset: 25%;
  stroke-dasharray: 0 50%;
  animation: checkstar-stroke 5s infinite alternate;
}
@keyframes checkstar-stroke {
  0% {
    fill: rgba(235,101,34,0);
    stroke: rgba(235,101,34,1);
    stroke-dashoffset: 25%;
    stroke-dasharray: 0 50%;
    stroke-width: 2;
  }
  70% {
    fill: rgba(235,101,34,0);
    stroke: rgba(235,101,34,1);
  }
  80% {
    fill: rgba(235,101,34,0);
    stroke: rgba(235,101,34,1);
    stroke-width: 3;
  }
  100% {
    fill: rgba(235,101,34,1);
    stroke: rgba(235,101,34,0);
    stroke-dashoffset: -25%;
    stroke-dasharray: 50% 0;
    stroke-width: 0;
  }
}
`

export function Loader({ className }: { className?: string } = {}) {
  return (
    <div className={`relative flex items-center justify-center ${className ?? 'h-10 w-32'}`}>
      <svg className="h-full w-full" viewBox="0 0 120 40" aria-hidden="true">
        <style>{LOADER_CSS}</style>
        <text x="50%" y="50%" dy=".35em" textAnchor="middle" className="checkstar-text">
          CheckStar
        </text>
      </svg>
    </div>
  )
}
