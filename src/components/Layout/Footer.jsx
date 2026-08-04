import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} Restaurant Manager. Todos los derechos reservados.
        </p>
        <div className="footer-links">
          <a href="#" className="footer-link">Términos de Servicio</a>
          <span className="footer-separator">•</span>
          <a href="#" className="footer-link">Política de Privacidad</a>
          <span className="footer-separator">•</span>
          <a href="#" className="footer-link">Soporte</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
