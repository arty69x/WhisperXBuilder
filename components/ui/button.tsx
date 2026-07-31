import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

type ButtonLinkProps = PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>> & {
  variant?: 'primary' | 'secondary';
};

export function ButtonLink({ children, className = '', variant = 'primary', ...props }: ButtonLinkProps) {
  const variants = {
    primary: 'bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400',
    secondary: 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
  };

  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
