import Link from "next/link";
import { Cherry } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-6 mt-8 border-t border-border/40 bg-background/50 backdrop-blur-sm print:hidden">
      <div className="container px-4 mx-auto flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Cherry className="w-4 h-4 text-primary/40" />
          <span>Sistema CHERRY</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="mx-1.5 text-border">•</span>
          <span>Creado por:</span>
          <Link 
            href="https://torrhez.myportfolio.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold hover:text-primary hover:underline underline-offset-2 transition-all"
          >
            Prof. Adrián Torres
          </Link>
        </div>
        <p className="flex items-center gap-1">
          <span>2026. Todos los derechos reservados</span>
          <span>©</span>
        </p>
      </div>
    </footer>
  );
}
