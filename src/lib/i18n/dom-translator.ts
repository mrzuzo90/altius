import { Language, translateToEnglish } from "./translations";

const ATTRS_TO_TRANSLATE = ["placeholder", "title", "aria-label", "alt"] as const;

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "IFRAME",
]);

class DomTranslator {
  private lang: Language = "es";
  private observer: MutationObserver | null = null;
  private headObserver: MutationObserver | null = null;
  private originalTextMap = new WeakMap<Node, string>();
  private translatedTextMap = new WeakMap<Node, string>();
  private originalAttrMap = new WeakMap<Element, Record<string, string>>();
  private translatedAttrMap = new WeakMap<Element, Record<string, string>>();
  private originalTitle: string | null = null;
  private lastTranslatedTitle: string | null = null;
  private modifiedNodes = new Set<Node>();
  private modifiedElements = new Set<Element>();
  private isApplying = false;

  public applyLanguage(lang: Language) {
    this.lang = lang;

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = lang;

    if (lang === "es") {
      this.stopObserving();
      this.restoreSpanish();
      return;
    }

    this.translateTitle();
    this.translateTree(document.body);
    this.startObserving();
  }

  private translateTitle() {
    if (typeof document === "undefined") return;
    const current = document.title;
    if (!current) return;

    if (this.originalTitle === null || current !== this.lastTranslatedTitle) {
      this.originalTitle = current;
    }

    const translated = translateToEnglish(this.originalTitle);
    if (translated !== this.originalTitle) {
      this.isApplying = true;
      document.title = translated;
      this.lastTranslatedTitle = translated;
      this.isApplying = false;
    } else {
      this.lastTranslatedTitle = current;
    }
  }

  private restoreTitle() {
    if (typeof document === "undefined") return;
    if (this.originalTitle !== null && document.title === this.lastTranslatedTitle) {
      this.isApplying = true;
      document.title = this.originalTitle;
      this.isApplying = false;
    }
    this.originalTitle = null;
    this.lastTranslatedTitle = null;
  }

  private restoreSpanish() {
    this.isApplying = true;
    try {
      this.restoreTitle();

      for (const node of this.modifiedNodes) {
        const original = this.originalTextMap.get(node);
        if (original !== undefined && node.nodeValue !== original) {
          node.nodeValue = original;
        }
        this.originalTextMap.delete(node);
        this.translatedTextMap.delete(node);
      }
      this.modifiedNodes.clear();

      for (const el of this.modifiedElements) {
        const origAttrs = this.originalAttrMap.get(el);
        if (origAttrs) {
          for (const [attr, val] of Object.entries(origAttrs)) {
            if (el.getAttribute(attr) !== val) {
              el.setAttribute(attr, val);
            }
          }
          this.originalAttrMap.delete(el);
          this.translatedAttrMap.delete(el);
        }
      }
      this.modifiedElements.clear();
    } finally {
      this.isApplying = false;
    }
  }

  private isSkippable(node: Node | null): boolean {
    let curr: Node | null = node;
    while (curr) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as Element;
        if (SKIP_TAGS.has(el.tagName)) return true;
        if (el.getAttribute("data-no-translate") === "true") return true;
      }
      curr = curr.parentNode;
    }
    return false;
  }

  private translateTree(root: Node | null) {
    if (!root || this.lang !== "en") return;
    this.isApplying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        if (!this.isSkippable(root)) {
          this.translateTextNode(root);
        }
        return;
      }

      if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as Element;
        if (
          SKIP_TAGS.has(el.tagName) ||
          el.getAttribute("data-no-translate") === "true"
        ) {
          return;
        }
        this.translateAttributes(el);
      }

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              if (
                SKIP_TAGS.has(el.tagName) ||
                el.getAttribute("data-no-translate") === "true"
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let current: Node | null = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          this.translateTextNode(current);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          this.translateAttributes(current as Element);
        }
        current = walker.nextNode();
      }
    } finally {
      this.isApplying = false;
    }
  }

  private translateTextNode(node: Node) {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;

    const lastTranslated = this.translatedTextMap.get(node);
    const hasOriginal = this.originalTextMap.has(node);

    // If React or another update replaced the node text, refresh its stored Spanish source
    if (!hasOriginal || raw !== lastTranslated) {
      this.originalTextMap.set(node, raw);
    }

    const source = this.originalTextMap.get(node) ?? raw;
    const translated = translateToEnglish(source);

    if (translated !== raw) {
      node.nodeValue = translated;
      this.translatedTextMap.set(node, translated);
      this.modifiedNodes.add(node);
    } else if (translated !== source) {
      this.translatedTextMap.set(node, translated);
      this.modifiedNodes.add(node);
    }
  }

  private translateAttributes(el: Element) {
    for (const attr of ATTRS_TO_TRANSLATE) {
      const val = el.getAttribute(attr);
      if (!val || !val.trim()) continue;

      let storedOrig = this.originalAttrMap.get(el);
      if (!storedOrig) {
        storedOrig = {};
        this.originalAttrMap.set(el, storedOrig);
      }

      let storedTrans = this.translatedAttrMap.get(el);
      if (!storedTrans) {
        storedTrans = {};
        this.translatedAttrMap.set(el, storedTrans);
      }

      if (!(attr in storedOrig) || val !== storedTrans[attr]) {
        storedOrig[attr] = val;
      }

      const source = storedOrig[attr];
      const translated = translateToEnglish(source);
      if (translated !== val) {
        el.setAttribute(attr, translated);
        storedTrans[attr] = translated;
        this.modifiedElements.add(el);
      } else if (translated !== source) {
        storedTrans[attr] = translated;
        this.modifiedElements.add(el);
      }
    }
  }

  private startObserving() {
    if (typeof MutationObserver === "undefined" || !document.body) {
      return;
    }

    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        if (this.isApplying || this.lang !== "en") return;

        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((added) => {
              this.translateTree(added);
            });
          } else if (mutation.type === "characterData") {
            const target = mutation.target;
            if (
              target.nodeType === Node.TEXT_NODE &&
              !this.isSkippable(target) &&
              target.nodeValue !== this.translatedTextMap.get(target)
            ) {
              this.isApplying = true;
              try {
                this.translateTextNode(target);
              } finally {
                this.isApplying = false;
              }
            }
          } else if (
            mutation.type === "attributes" &&
            mutation.target.nodeType === Node.ELEMENT_NODE
          ) {
            const el = mutation.target as Element;
            if (!this.isSkippable(el)) {
              this.isApplying = true;
              try {
                this.translateAttributes(el);
              } finally {
                this.isApplying = false;
              }
            }
          }
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATTRS_TO_TRANSLATE],
      });
    }

    if (!this.headObserver && document.head) {
      this.headObserver = new MutationObserver(() => {
        if (this.isApplying || this.lang !== "en") return;
        this.translateTitle();
      });
      this.headObserver.observe(document.head, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  private stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.headObserver) {
      this.headObserver.disconnect();
      this.headObserver = null;
    }
  }
}

export const domTranslator = new DomTranslator();
