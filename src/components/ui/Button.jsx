export default function Button({ children, variant = 'primary', onClick, className = '', disabled = false }) {
  const variants = {
    primary: 'gradient-primary text-white font-semibold shadow-lg hover:shadow-xl glow-on-hover',
    secondary: 'bg-surfaceMuted text-textPrimary border border-brandPrimary/30 hover:border-brandPrimary/50 hover:bg-opacity-80',
    outline: 'border border-brandPrimary/40 hover:border-brandPrimary/70 hover:bg-brandPrimary/10 text-textPrimary',
    ghost: 'hover:bg-brandPrimary/10 text-textPrimary'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 ease-out active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
