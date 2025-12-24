export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surfaceMuted text-textSecondary border backdrop-blur-sm',
    primary: 'bg-brandPrimary/10 text-brandPrimary border border-brandPrimary/25 shadow-sm shadow-glow',
    accent: 'bg-brandAccent/10 text-brandAccent border border-brandAccent/25 shadow-sm',
    success: 'bg-success/10 text-success border border-success/25 shadow-sm',
    warning: 'bg-warning/10 text-warning border border-warning/25 shadow-sm',
    error: 'bg-error/10 text-error border border-error/25 shadow-sm',
    info: 'bg-brandSecondary/10 text-brandSecondary border border-brandSecondary/25 shadow-sm'
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
