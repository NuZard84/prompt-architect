import { NavLink as RouterNavLink, Link, useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { To } from "react-router-dom";

interface NavLinkCompatProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  to: To;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** Custom active check — RR v6 removed isActive from NavLink; use this for nested routes */
  isActive?: (pathname: string) => boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, isActive: isActiveFn, to, children, ...props }, ref) => {
    const { pathname } = useLocation();

    // When custom isActive provided, use Link + manual active state (RR v6 has no isActive callback)
    if (isActiveFn) {
      const active = isActiveFn(pathname);
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={cn(className, active && activeClassName)}
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      >
        {children}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
