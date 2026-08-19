import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import menuTemplateService from '../services/menuTemplateService'
import './MenuTemplatePrint.css'

const formatPrice = (price) => {
  const value = Number(price)
  return Number.isFinite(value) ? `S/ ${value.toFixed(2)}` : ''
}

const sectionIcon = (name) => {
  const normalized = name.toLowerCase()

  if (normalized.includes('entrada')) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18M8 6c0 2 1.8 3 4 3s4-1 4-3M8 18c0-2 1.8-3 4-3s4 1 4 3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h16M6 10a6 6 0 0 1 12 0M5 14h14M8 18h8" />
    </svg>
  )
}

const SabePeruMark = () => (
  <svg className="sabe-peru-mark" viewBox="0 0 96 72" role="img" aria-label="Logo de Sabe Perú, olla sobre el fuego">
    <path className="mark-steam" d="M36 13c-5-5 5-8 0-13M51 13c-5-5 5-8 0-13" />
    <path className="mark-ladle" d="M60 8 52 31M61 5a3.5 3.5 0 1 1-1.8 6.8" />
    <path className="mark-pot-rim" d="M20 26c5-8 50-8 56 0 5 8-9 13-28 13S15 34 20 26Z" />
    <path className="mark-pot" d="M23 33c1 18 8 27 25 27s24-9 25-27" />
    <path className="mark-handle" d="M73 32c18-10 21 15 4 16" />
    <path className="mark-flame" d="M31 70c-2-8 7-10 5-20 7 5 8 10 7 15 3-8 11-9 12-18 7 9 11 15 7 23" />
  </svg>
)

const MenuTemplatePrint = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadTemplate = async () => {
      try {
        setLoading(true)
        const response = await menuTemplateService.getTemplateById(id)
        if (active) {
          if (response.success && response.data) {
            setTemplate(response.data)
          } else {
            setError('No se pudo cargar la plantilla.')
          }
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'No se pudo cargar la plantilla.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTemplate()
    return () => { active = false }
  }, [id])

  const sections = useMemo(() => {
    const grouped = new Map()

    ;(template?.items || []).forEach(item => {
      const key = item.sectionId ?? 'other'
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name: item.sectionName || 'Otros',
          items: []
        })
      }
      grouped.get(key).items.push(item)
    })

    return Array.from(grouped.values())
  }, [template])

  const beverageSections = sections.filter(section =>
    /bebida|cerveza|refresco|gaseosa/i.test(section.name)
  )
  const mainSections = sections.filter(section => !beverageSections.includes(section))

  if (loading) {
    return <div className="menu-print-status">Preparando vista previa…</div>
  }

  if (error || !template) {
    return (
      <div className="menu-print-status menu-print-error">
        <p>{error || 'Plantilla no encontrada.'}</p>
        <button type="button" onClick={() => navigate('/master-menu-templates')}>Volver</button>
      </div>
    )
  }

  return (
    <main className="menu-print-screen">
      <div className="menu-print-toolbar" role="toolbar" aria-label="Acciones de impresión">
        <button type="button" className="menu-print-back" onClick={() => navigate('/master-menu-templates')}>
          <span aria-hidden="true">←</span> Volver
        </button>
        <div>
          <strong>Vista previa A4</strong>
          <span>Activa “gráficos de fondo” para conservar los acentos rojos.</span>
        </div>
        <button type="button" className="menu-print-action" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </button>
      </div>

      <article className="menu-sheet">
        <header className="menu-sheet-header">
          <SabePeruMark />
          <p>RESTAURANTE</p>
          <h1>{user?.organizationName || 'Sabe Perú'}</h1>
          <div className="menu-header-rule"><span /></div>
          <h2>Sabor peruano en cada plato</h2>
        </header>

        {sections.length === 0 ? (
          <div className="menu-empty">Esta plantilla todavía no tiene productos.</div>
        ) : (
          <div className={`menu-sheet-grid ${beverageSections.length === 0 ? 'menu-sheet-grid--single' : ''}`}>
            <div className="menu-main-sections">
              {mainSections.map(section => (
                <section className="printed-menu-section" key={section.id}>
                  <div className="printed-section-heading">
                    <span className="printed-section-icon">{sectionIcon(section.name)}</span>
                    <h3>{section.name}</h3>
                    <span className="printed-section-line" />
                  </div>
                  <div className="printed-menu-items">
                    {section.items.map(item => (
                      <div className="printed-menu-item" key={item.id}>
                        <span>{item.productName}</span>
                        <span className="printed-item-leader" aria-hidden="true" />
                        <strong>{formatPrice(item.productPrice)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

            </div>

            {beverageSections.length > 0 && (
              <aside className="menu-side-panel">
                {beverageSections.map(section => (
                  <section className="printed-menu-section printed-menu-section--side" key={section.id}>
                    <div className="printed-section-heading printed-section-heading--side">
                      <h3>{section.name}</h3>
                      <span className="printed-section-line" />
                    </div>
                    <div className="printed-menu-items">
                      {section.items.map(item => (
                        <div className="printed-menu-item printed-menu-item--side" key={item.id}>
                          <span>{item.productName}</span>
                          <strong>{formatPrice(item.productPrice)}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="menu-takeaway">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M13 17h22l2 25H11l2-25ZM18 17v-4a6 6 0 0 1 12 0v4" />
                  </svg>
                  <strong>LLEVAR</strong>
                  <span>+ S/ 1.00</span>
                </div>

                <div className="menu-payment-notes">
                  <strong>VISA + S/ 1.00</strong>
                  <span>+ EL 5% A PARTIR DE<br />S/ 30.00 DE CONSUMO</span>
                </div>

                <blockquote className="menu-inspirational-quote">
                  <span aria-hidden="true">“</span>
                  <p>Cada día es una nueva oportunidad para compartir, agradecer y disfrutar.</p>
                </blockquote>
              </aside>
            )}
          </div>
        )}

        <footer className="menu-sheet-footer"><span /><i /><span /></footer>
      </article>
    </main>
  )
}

export default MenuTemplatePrint
