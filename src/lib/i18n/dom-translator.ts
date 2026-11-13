import { translateToEnglish, type Language } from "./translations";

/**
 * Motor de traducción instantánea del DOM para Altius.
 *
 * Permite cambiar de idioma en 0 milisegundos sin recargar la página,
 * traduciendo Server Components, Client Components, diálogos, tooltips
 * y gráficos dinámicos sin perder reactividad ni romper hidratación.
 */

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "SVG",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "IFRAME",
]);

class DomTranslator {
  private currentLang: Language = "es";
  private observer: MutationObserver | null = null;
  private isTranslating = false;

  // Guarda el texto original en español de cada nodo para poder restaurarlo con precisión total
  private originalTextMap = new WeakMap<Node, string>();
  private originalAttrMap = new WeakMap<Element, Record<string, string>>();
  private modifiedNodes = new Set<Node>();
  private modifiedElements = new Set<Element>();

  /**
   * Aplica el idioma al documento inmediatamente
   */
  public applyLanguage(lang: Language): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);

    if (lang === "es") {
      this.restoreSpanish();
      this.disconnectObserver();
    } else {
      this.translateToEnglish();
      this.connectObserver();
    }
  }

  public getCurrentLanguage(): Language {
    return this.currentLang;
  }

  /**
   * Recorre el DOM traduciendo al inglés todos los textos reconocidos
   */
  private translateToEnglish(): void {
    if (typeof document === "undefined" || !document.body) return;
    this.isTranslating = true;

    try {
      this.walkAndTranslate(document.body);
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Restaura los textos originales en español
   */
  private restoreSpanish(): void {
    this.isTranslating = true;

    try {
      // 1. Restaurar nodos de texto modificados
      for (const node of this.modifiedNodes) {
        if (node.parentNode && this.originalTextMap.has(node)) {
          const original = this.originalTextMap.get(node)!;
          if (node.nodeValue !== original) {
            node.nodeValue = original;
          }
        }
      }
      this.modifiedNodes.clear();

      // 2. Restaurar atributos modificados
      for (const el of this.modifiedElements) {
        const originalAttrs = this.originalAttrMap.get(el);
        if (originalAttrs) {
          for (const [attrName, originalVal] of Object.entries(originalAttrs)) {
            el.setAttribute(attrName, originalVal);
          }
        }
      }
      this.modifiedElements.clear();
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Inspecciona recursivamente un elemento y sus hijos
   */
  private walkAndTranslate(root: Node): void {
    if (root.nodeType === Node.ELEMENT_NODE) {
      const el = root as Element;
      if (SKIP_TAGS.has(el.tagName) || el.getAttribute("translate") === "no" || el.hasAttribute("data-no-translate")) {
        return;
      }

      // Traducir atributos comunes
      this.translateAttributes(el);
    }

    if (root.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(root);
      return;
    }

    let child = root.firstChild;
    while (child) {
      const next = child.nextSibling;
      this.walkAndTranslate(child);
      child = next;
    }
  }

  /**
   * Traduce un nodo de texto individual
   */
  private translateTextNode(node: Node): void {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;

    // Si no tenemos registrado su texto original en español, lo guardamos ahora
    if (!this.originalTextMap.has(node)) {
      this.originalTextMap.set(node, raw);
    }

    const original = this.originalTextMap.get(node) || raw;
    const translated = translateToEnglish(original);

    if (translated !== raw) {
      node.nodeValue = translated;
      this.modifiedNodes.add(node);
    }
  }

  /**
   * Traduce atributos como placeholder, title o aria-label
   */
  private translateAttributes(el: Element): void {
    const attrNames = ["placeholder", "title", "aria-label"];
    for (const attr of attrNames) {
      const val = el.getAttribute(attr);
      if (val && val.trim()) {
        let stored = this.originalAttrMap.get(el);
        if (!stored) {
          stored = {};
          this.originalAttrMap.set(el, stored);
        }
        if (!(attr in stored)) {
          stored[attr] = val;
        }

        const original = stored[attr] || val;
        const translated = translateToEnglish(original);
        if (translated !== val) {
          el.setAttribute(attr, translated);
          this.modifiedElements.add(el);
        }
      }
    }
  }

  /**
   * Inicia el MutationObserver para capturar contenido dinámico (tabs, diálogos, gráficos, Cid)
   */
  private connectObserver(): void {
    if (this.observer || typeof MutationObserver === "undefined") return;

    this.observer = new MutationObserver((mutations) => {
      if (this.isTranslating || this.currentLang !== "en") return;

      this.isTranslating = true;
      try {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              this.walkAndTranslate(mutation.addedNodes[i]);
            }
          } else if (mutation.type === "characterData") {
            const target = mutation.target;
            // Si el texto cambió desde React (por ejemplo un contador o filtro)
            if (!this.modifiedNodes.has(target)) {
              this.translateTextNode(target);
            }
          } else if (mutation.type === "attributes" && mutation.target.nodeType === Node.ELEMENT_NODE) {
            this.translateAttributes(mutation.target as Element);
          }
        }
      } finally {
        this.isTranslating = false;
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

export const domTranslator = new DomTranslator();
