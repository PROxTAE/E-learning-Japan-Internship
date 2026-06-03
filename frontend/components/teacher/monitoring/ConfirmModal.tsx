"use client";

import { Modal, Button } from "@heroui/react";
import { useLang } from "@/lib/i18n/LanguageContext";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  /** Optional label input — shows a text field inside the modal */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
}: ConfirmModalProps) {
  const { t } = useLang();

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container placement="center">
          <Modal.Dialog className="rounded-2xl overflow-hidden max-w-sm w-full">
            {/* Header */}
            <Modal.Header className="flex flex-col gap-1 px-6 pt-6 pb-2">
              <Modal.Heading className="text-lg font-bold text-foreground">
                {title}
              </Modal.Heading>
            </Modal.Header>

            {/* Body */}
            <Modal.Body className="px-6 pb-2 space-y-4">
              <p className="text-sm text-default-500">{message}</p>

              {/* Optional input field (e.g. for session label) */}
              {inputLabel && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-default-600 uppercase tracking-wide">
                    {inputLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={inputPlaceholder || ""}
                    value={inputValue || ""}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl text-sm border border-default-300 dark:border-white/20 bg-background text-foreground placeholder-default-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              )}
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="px-6 pb-6 pt-2 flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onPress={onClose}
                className="font-semibold text-default-500"
              >
                {cancelText || t.modal.cancel}
              </Button>
              <Button
                size="sm"
                variant={isDanger ? "danger" : "primary"}
                onPress={onConfirm}
                className="font-bold"
              >
                {confirmText || "Confirm"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
