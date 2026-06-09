"use client";

import React, { useState, useCallback } from "react";

interface ModalField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "time"
    | "email"
    | "textarea"
    | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  fields: ModalField[];
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onClose: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  fields,
  onSubmit,
  onClose,
  submitButtonText = "Guardar",
  cancelButtonText = "Cancelar",
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      initial[field.name] = field.defaultValue || "";
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      // Check required
      if (field.required && (!value || value.toString().trim() === "")) {
        newErrors[field.name] = `${field.label} es requerido`;
        return;
      }

      // Type-specific validation
      if (value) {
        switch (field.type) {
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.name] = "Email inválido";
            }
            break;
          case "number":
            if (isNaN(Number(value))) {
              newErrors[field.name] = "Debe ser un número";
            }
            break;
          case "date":
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              newErrors[field.name] = "Formato de fecha inválido (YYYY-MM-DD)";
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      const newData: Record<string, any> = {};
      fields.forEach((field) => {
        newData[field.name] = field.defaultValue || "";
      });
      setFormData(newData);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({
        submit: "Error al enviar el formulario",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isSubmitting || isLoading}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-300"
              >
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`mt-1 w-full rounded border ${
                    errors[field.name]
                      ? "border-red-500 bg-red-900/10"
                      : "border-gray-600 bg-gray-700"
                  } px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none`}
                  rows={4}
                  disabled={isSubmitting || isLoading}
                />
              ) : field.type === "select" ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`mt-1 w-full rounded border ${
                    errors[field.name]
                      ? "border-red-500 bg-red-900/10"
                      : "border-gray-600 bg-gray-700"
                  } px-3 py-2 text-white focus:border-blue-500 focus:outline-none`}
                  disabled={isSubmitting || isLoading}
                >
                  <option value="">
                    {field.placeholder || "Seleccionar..."}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`mt-1 w-full rounded border ${
                    errors[field.name]
                      ? "border-red-500 bg-red-900/10"
                      : "border-gray-600 bg-gray-700"
                  } px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none`}
                  disabled={isSubmitting || isLoading}
                />
              )}

              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-400">{errors[field.name]}</p>
              )}
            </div>
          ))}

          {errors.submit && (
            <div className="rounded bg-red-900/20 p-3 text-sm text-red-400">
              {errors.submit}
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded bg-gray-700 px-4 py-2 font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50"
            >
              {cancelButtonText}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting || isLoading ? "Guardando..." : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
