export default function Template({ children }: { children: React.ReactNode }) {
  // Remounts per navigation (unlike layout.tsx), replaying the enter animation.
  return <div className="page-enter">{children}</div>;
}
