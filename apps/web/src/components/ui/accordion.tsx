"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<string>("");

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within Accordion");
  return ctx;
}

function useAccordionItemValue() {
  return React.useContext(AccordionItemContext);
}

type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children?: React.ReactNode;
};

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      defaultValue,
      value: controlledValue,
      onValueChange,
      className,
      children,
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      string | string[]
    >(() => {
      if (defaultValue !== undefined) return defaultValue;
      return type === "multiple" ? [] : "";
    });

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const openItems = React.useMemo(() => {
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    }, [value]);

    const toggle = React.useCallback(
      (itemValue: string) => {
        const next = (() => {
          if (type === "single") {
            return openItems.includes(itemValue) ? [] : [itemValue];
          }
          if (openItems.includes(itemValue)) {
            return openItems.filter((v) => v !== itemValue);
          }
          return [...openItems, itemValue];
        })();
        const nextValue = type === "single" ? next[0] ?? "" : next;
        if (!isControlled) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);
      },
      [type, openItems, isControlled, onValueChange]
    );

    const ctx: AccordionContextValue = React.useMemo(
      () => ({ openItems, toggle, type }),
      [openItems, toggle, type]
    );

    return (
      <AccordionContext.Provider value={ctx}>
        <div ref={ref} className={cn("w-full", className)} data-state="">
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

type AccordionItemProps = {
  value: string;
  className?: string;
  children?: React.ReactNode;
};

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={value}>
        <div
          ref={ref}
          data-state=""
          data-value={value}
          className={cn("border-b last:border-b-0", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children?: React.ReactNode;
};

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps & { value?: string }
>(function AccordionTrigger(
  { value: itemValue, className, children, onClick, ...props },
  ref
) {
  const accordion = useAccordion();
  const itemValueFromContext = useAccordionItemValue();
  const value = itemValue ?? itemValueFromContext;
  const isOpen = accordion.openItems.includes(value);

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={isOpen}
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={(e) => {
        accordion.toggle(value);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0 transition-transform duration-200"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

type AccordionContentProps = {
  className?: string;
  children?: React.ReactNode;
};

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const accordion = useAccordion();
    const itemValue = useAccordionItemValue();
    const isOpen = accordion.openItems.includes(itemValue);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        data-state="open"
        className={cn("overflow-hidden text-sm pb-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, useAccordion };
