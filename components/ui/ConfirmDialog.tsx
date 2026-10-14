'use client'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-[9999] p-4 animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${confirmStyles[confirmVariant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
