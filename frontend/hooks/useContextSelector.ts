import { useEffect } from "react";

export interface AIContext {
  type: string;
  name: string;
  data: any;
}

export function useContextSelector(
  isActive: boolean,
  onSelect: (context: AIContext) => void
) {
  useEffect(() => {
    if (!isActive) return;

    // Handle mouse move (add custom border highlight)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const contextEl = target.closest("[data-ai-context-type]");
      if (contextEl) {
        contextEl.classList.add("ai-inspect-highlight");
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const contextEl = target.closest("[data-ai-context-type]");
      if (contextEl) {
        contextEl.classList.remove("ai-inspect-highlight");
      }
    };

    // Intercept click on context component
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const contextEl = target.closest("[data-ai-context-type]") as HTMLElement;

      if (contextEl) {
        e.preventDefault();
        e.stopPropagation();

        const type = contextEl.getAttribute("data-ai-context-type") || "general";
        const name = contextEl.getAttribute("data-ai-context-name") || "Component";
        const rawData = contextEl.getAttribute("data-ai-context-data");
        
        let data = null;
        if (rawData) {
          try {
            data = JSON.parse(rawData);
          } catch (err) {
            console.error("Failed to parse context JSON data:", err);
            data = rawData;
          }
        }

        // Clean up outline style
        contextEl.classList.remove("ai-inspect-highlight");

        onSelect({ type, name, data });
      }
    };

    // Add listeners using capture phase (true) to intercept actions before bubbling
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("click", handleClick, true);
      
      // Clean up any remaining highlights when component unmounts or selector deactivates
      const highlighted = document.querySelectorAll(".ai-inspect-highlight");
      highlighted.forEach((el) => el.classList.remove("ai-inspect-highlight"));
    };
  }, [isActive, onSelect]);
}
