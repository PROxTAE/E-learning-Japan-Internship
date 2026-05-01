"use client";

import { useState, useEffect } from "react";
import {
  Modal, Button, Form, TextField, InputGroup, Label, FieldError,
  Select, ListBox,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { BookOpen } from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/teacher/quiz.mock";
import type { Quiz, CreateQuizFormData, QuizDifficulty } from "@/types/teacher/quiz.types";
import { useLang } from "@/lib/i18n/LanguageContext";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuiz?: Quiz | null;
  onSave: (data: CreateQuizFormData, id?: string) => void;
}

const DEFAULT_FORM: CreateQuizFormData = {
  title: "", description: "", categoryId: "", difficulty: "medium", duration: 30, tags: "",
};

export function CreateQuizModal({ isOpen, onClose, editingQuiz, onSave }: CreateQuizModalProps) {
  const [form, setForm] = useState<CreateQuizFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateQuizFormData, string>>>({});
  const { t } = useLang();
  const m = t.modal;

  useEffect(() => {
    if (editingQuiz) {
      setForm({
        title: editingQuiz.title,
        description: editingQuiz.description,
        categoryId: editingQuiz.categoryId,
        difficulty: editingQuiz.difficulty,
        duration: editingQuiz.duration,
        tags: editingQuiz.tags.join(", "),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [editingQuiz, isOpen]);

  const set = (key: keyof CreateQuizFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = t.validation.titleRequired;
    if (!form.categoryId) next.categoryId = t.validation.categoryRequired;
    if (form.duration < 1) next.duration = t.validation.durationMin;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave(form, editingQuiz?.id);
    onClose();
  };

  const difficultyOptions: { key: QuizDifficulty; label: string }[] = [
    { key: "easy", label: m.easyLabel },
    { key: "medium", label: m.mediumLabel },
    { key: "hard", label: m.hardLabel },
  ];

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()} variant="blur">
      <Modal.Container size="md" placement="auto" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />

          <Modal.Header>
            <Modal.Icon className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <BookOpen className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{editingQuiz ? m.editTitle : m.createTitle}</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              {editingQuiz ? m.editSubtitle : m.createSubtitle}
            </p>
          </Modal.Header>

          <Modal.Body className="px-6 py-4">
            {/* Form id links submit button in Modal.Footer */}
            <Form
              id="quiz-form"
              className="flex flex-col gap-4"
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            >
              {/* Title */}
              <TextField
                fullWidth
                name="title"
                isRequired
                isInvalid={!!errors.title}
                value={form.title}
                onChange={(val) => set("title", val)}
              >
                <Label>{m.titleLabel}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input placeholder={m.titlePlaceholder} />
                </InputGroup>
                <FieldError>{errors.title}</FieldError>
              </TextField>

              {/* Description */}
              <TextField
                fullWidth
                name="description"
                value={form.description}
                onChange={(val) => set("description", val)}
              >
                <Label>{m.descLabel}</Label>
                <InputGroup fullWidth>
                  <InputGroup.TextArea
                    rows={3}
                    value={form.description}
                    placeholder={m.descPlaceholder}
                    className="resize-none"
                    onChange={(e) => set("description", e.target.value)}
                  />
                </InputGroup>
              </TextField>

              {/* Category + Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  fullWidth
                  name="categoryId"
                  isRequired
                  isInvalid={!!errors.categoryId}
                  placeholder={m.categoryPlaceholder}
                  value={form.categoryId || null}
                  onChange={(val: Key | null) => set("categoryId", val ? String(val) : "")}
                >
                  <Label>{m.categoryLabel}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {MOCK_CATEGORIES.map((cat) => (
                        <ListBox.Item key={cat.id} id={cat.id} textValue={cat.name}>
                          {cat.icon} {cat.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                  <FieldError>{errors.categoryId}</FieldError>
                </Select>

                <Select
                  fullWidth
                  name="difficulty"
                  value={form.difficulty}
                  onChange={(val: Key | null) =>
                    set("difficulty", val ? (val as QuizDifficulty) : "medium")
                  }
                >
                  <Label>{m.difficultyLabel}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {difficultyOptions.map((d) => (
                        <ListBox.Item key={d.key} id={d.key} textValue={d.label}>
                          {d.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              {/* Duration */}
              <TextField
                fullWidth
                name="duration"
                type="number"
                isInvalid={!!errors.duration}
                value={String(form.duration)}
                onChange={(val) => set("duration", Number(val))}
              >
                <Label>{m.durationLabel}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input type="number" min={1} max={180} />
                </InputGroup>
                <FieldError>{errors.duration}</FieldError>
              </TextField>

              {/* Tags */}
              <TextField
                fullWidth
                name="tags"
                value={form.tags}
                onChange={(val) => set("tags", val)}
              >
                <Label>{m.tagsLabel}</Label>
                <InputGroup fullWidth>
                  <InputGroup.Input placeholder={m.tagsPlaceholder} />
                </InputGroup>
              </TextField>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" slot="close">{m.cancel}</Button>
            {/* type="submit" + form="quiz-form" triggers the Form above */}
            <Button
              type="submit"
              form="quiz-form"
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-md shadow-violet-500/25"
            >
              {editingQuiz ? m.save : m.create}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
