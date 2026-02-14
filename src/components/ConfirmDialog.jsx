import { useEffect, useRef } from 'react'

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText }) {
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-6 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{title || '确认删除'}</h3>
          <p className="text-sm text-slate-400 mb-6">{message || '确定要删除吗？此操作无法撤销。'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {cancelText || '取消'}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all shadow-lg shadow-red-500/20"
          >
            {confirmText || '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
