import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import './ConfirmDialog.css'

const ConfirmDialogContext = createContext(null)

export const ConfirmDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)
  const confirmButtonRef = useRef(null)

  const closeDialog = useCallback((confirmed) => {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const confirm = useCallback((options) => {
    if (resolverRef.current) {
      resolverRef.current(false)
    }

    setDialog({
      title: 'Confirmar acción',
      message: '¿Deseas continuar?',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      ...options
    })

    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  useEffect(() => {
    if (!dialog) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDialog(false)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dialog, closeDialog])

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="confirm-dialog-overlay" onMouseDown={() => closeDialog(false)}>
          <div
            className={`confirm-dialog confirm-dialog--${dialog.variant}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-dialog-close"
              aria-label="Cerrar confirmación"
              onClick={() => closeDialog(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="confirm-dialog-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </div>

            <div className="confirm-dialog-copy">
              <h2 id="confirm-dialog-title">{dialog.title}</h2>
              <p id="confirm-dialog-message">{dialog.message}</p>
            </div>

            <div className="confirm-dialog-actions">
              <button type="button" className="confirm-dialog-cancel" onClick={() => closeDialog(false)}>
                {dialog.cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className="confirm-dialog-confirm"
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  )
}

export const useConfirmDialog = () => {
  const confirm = useContext(ConfirmDialogContext)
  if (!confirm) {
    throw new Error('useConfirmDialog must be used inside ConfirmDialogProvider')
  }
  return confirm
}
