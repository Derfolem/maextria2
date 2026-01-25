import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          © {new Date().getFullYear()} <strong>MAEXTRIA</strong>. Todos os direitos reservados.
        </p>
        <nav className="flex gap-4 text-sm">
          <a href="/sobre" className="hover:text-white transition">Sobre</a>
          <a href="/cursos" className="hover:text-white transition">Cursos</a>
          <a href="/contato" className="hover:text-white transition">Contato</a>
        </nav>
      </div>
    </footer>
  );
}
