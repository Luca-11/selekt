"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { usePageTransition } from "@/components/PageTransitionProvider";

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const pathname = usePathname();
  const { navigate } = usePageTransition();
  const hrefString = typeof href === "string" ? href : (href.pathname ?? "/");

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        const targetPath = hrefString.split("#")[0] || "/";
        const currentPath = pathname.split("#")[0] || "/";
        if (targetPath === currentPath) return;

        event.preventDefault();
        navigate(hrefString);
      }}
      {...props}
    />
  );
}
