export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`gradient-card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border premium-shadow transition-all duration-500 ease-out ${
        hover ? 'premium-shadow-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
