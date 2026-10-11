import React from 'react';
import { navigate } from './router';

// সাধারণ <a> — তাই রাইট-ক্লিক/নতুন ট্যাবে খোলা যায় ও সার্চ ইঞ্জিন লিংক দেখতে পায়।
// সাধারণ ক্লিকে পেজ রিলোড না করে SPA-র মতো চলে।
export function Link({ to, children, className, onClick, ...rest }: {
  to: string; children: React.ReactNode; className?: string; onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
