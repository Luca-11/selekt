import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PublicHeaderProps {
  showSearch?: boolean;
  search?: React.ReactNode;
}

export function PublicHeader({ showSearch = false, search }: PublicHeaderProps) {
  return (
    <header className="header">
      <div className="header__inner">
        <Link href="/" className="logo header__brand">
          Selekt
        </Link>
        <div className="header__actions">
          {showSearch && search}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
