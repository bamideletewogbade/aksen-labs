/**
 * Three connected nodes: the mark this company uses to stand for its own work.
 *
 * It exists so that nothing has to reach for a robot face. A cartoon robot is
 * the default illustration for anything with a model behind it, and it says the
 * one thing Aksen spends the rest of the site arguing against: that there is a
 * machine here doing the deciding. Three joined points say connected work,
 * which is what is actually being sold.
 */
export function NodeMark({ size = 19 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M6 17.5 12 6.5 18 15 6 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity=".55"
      />
      <circle cx="6" cy="17.5" r="2.1" fill="currentColor" />
      <circle cx="12" cy="6.5" r="2.1" fill="currentColor" />
      <circle cx="18" cy="15" r="2.1" fill="currentColor" />
    </svg>
  );
}
