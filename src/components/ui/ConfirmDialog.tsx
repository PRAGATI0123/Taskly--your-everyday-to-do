"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Explain exactly what will happen. */
  children: ReactNode;
  /** Text on the confirm button, e.g. "Delete project". */
  confirmLabel: string;
  /** Red button for things that can't be undone. */
  danger?: boolean;
  /** Shown if the action failed. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Are you sure?" pop-up. Used before deleting things. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          {/* Cancel comes first and is the safe choice. */}
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-muted">{children}</div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
