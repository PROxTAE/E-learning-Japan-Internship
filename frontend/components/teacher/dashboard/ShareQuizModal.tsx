"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@heroui/react";
import { CheckCircle, Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useLang } from "@/lib/i18n/LanguageContext";
import type { Quiz } from "@/types/teacher/quiz.types";
import { quizApi } from "@/services/quizApi";

interface ShareQuizModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareQuizModal({ quiz, isOpen, onClose }: ShareQuizModalProps) {
  const { t } = useLang();
  const d = t.detail;
  const [qrUrl, setQrUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(quiz);

  // When students join, they go to /play/[code]
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const joinUrl = currentQuiz.accessCode ? `${baseUrl}/play/${currentQuiz.accessCode}` : "";

  useEffect(() => {
    let mounted = true;
    
    // Auto-generate code if it doesn't exist
    const ensureCode = async () => {
      if (isOpen && !currentQuiz.accessCode) {
        try {
          const updated = await quizApi.generateCode(currentQuiz.id);
          // Cast the builder Quiz type to the teacher Quiz type to satisfy TypeScript
          if (mounted) setCurrentQuiz((prev) => ({ ...prev, accessCode: updated.accessCode }));
        } catch (error) {
          console.error("Failed to generate access code", error);
        }
      }
    };
    
    ensureCode();

    if (isOpen && joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000FF",
          light: "#FFFFFFFF",
        },
      }).then((url) => {
        if (mounted) setQrUrl(url);
      }).catch(console.error);
    }
    
    return () => { mounted = false; };
  }, [isOpen, joinUrl, currentQuiz.id, currentQuiz.accessCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (currentQuiz.accessCode) {
      navigator.clipboard.writeText(currentQuiz.accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-violet-500" />
                <Modal.Heading className="text-lg font-bold">{d.share}</Modal.Heading>
              </div>
              <p className="text-sm font-normal text-default-500 line-clamp-1">{currentQuiz.title}</p>
            </Modal.Header>
            <Modal.Body className="flex flex-col items-center py-4 gap-6">
              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl border-2 border-default-100 shadow-sm">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-default-300">Loading...</div>
                )}
              </div>

              <div className="w-full space-y-4">
                {/* Access Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-default-500 uppercase">{d.shareCode}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-default-100 dark:bg-default-50/5 text-center py-3 rounded-xl border border-default-200/50 dark:border-default-700/50 text-2xl font-black tracking-[0.25em] text-violet-600 dark:text-violet-400 font-mono">
                      {currentQuiz.accessCode || "------"}
                    </div>
                    <Button
                      isIconOnly
                      variant={copiedCode ? "primary" : "secondary"}
                      className="h-full px-4 rounded-xl"
                      onPress={handleCopyCode}
                    >
                      {copiedCode ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                {/* Share Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-default-500 uppercase">{d.shareLink}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-default-100 dark:bg-default-50/5 px-3 py-2.5 rounded-xl border border-default-200/50 dark:border-default-700/50 text-sm truncate text-default-600">
                      {joinUrl}
                    </div>
                    <Button
                      isIconOnly
                      variant={copiedLink ? "primary" : "secondary"}
                      className="shrink-0 rounded-xl"
                      onPress={handleCopyLink}
                    >
                      {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onPress={onClose} className="w-full font-semibold">
                Done
              </Button>
            </Modal.Footer>
            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
