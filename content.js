
(function () {
  "use strict";

  const translations = window.SU_TRANSLATIONS || {};

  if (Object.keys(translations).length === 0) {
    console.warn("[繁中翻譯] 翻譯詞庫尚未載入。");
    return;
  }

  const ignoredTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "CODE",
    "PRE",
    "TEXTAREA"
  ]);

  const attributeNames = [
    "placeholder",
    "title",
    "aria-label"
  ];

  const keys = Object.keys(translations)
    .sort((a, b) => b.length - a.length);

  const patterns = keys.map(key => ({
    key,
    regex: new RegExp(
      "(^|[^A-Za-z0-9])(" +
      key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      ")(?=$|[^A-Za-z0-9])",
      "g"
    )
  }));

  function translateText(text) {
    const trimmed = text.trim();

    if (!trimmed) return text;

    if (
      Object.prototype.hasOwnProperty.call(
        translations,
        trimmed
      )
    ) {
      return text.replace(trimmed, translations[trimmed]);
    }

    let result = text;

    for (const item of patterns) {
      result = result.replace(
        item.regex,
        (match, prefix) => prefix + translations[item.key]
      );
    }

    return result;
  }

  function shouldIgnore(element) {
    while (element) {
      if (
        ignoredTags.has(element.tagName) ||
        element.isContentEditable
      ) {
        return true;
      }

      element = element.parentElement;
    }

    return false;
  }

  function translateElementAttributes(element) {
    for (const name of attributeNames) {
      if (!element.hasAttribute(name)) continue;

      const original = element.getAttribute(name);
      const translated = translateText(original);

      if (translated !== original) {
        element.setAttribute(name, translated);
      }
    }

    if (
      element instanceof HTMLInputElement &&
      ["button", "submit", "reset"].includes(element.type)
    ) {
      const original = element.value;
      const translated = translateText(original);

      if (translated !== original) {
        element.value = translated;
      }
    }
  }

  function translateNode(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      if (shouldIgnore(root.parentElement)) return;

      const original = root.nodeValue;
      const translated = translateText(original);

      if (translated !== original) {
        root.nodeValue = translated;
      }

      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (shouldIgnore(root)) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    );

    let node = root;

    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!shouldIgnore(node)) {
          translateElementAttributes(node);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (!shouldIgnore(node.parentElement)) {
          const original = node.nodeValue;
          const translated = translateText(original);

          if (translated !== original) {
            node.nodeValue = translated;
          }
        }
      }

      node = walker.nextNode();
    }
  }

  function startTranslation() {
    if (document.body) {
      translateNode(document.body);
    }
  }

  startTranslation();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          translateNode(node);
        }
      }

      if (mutation.type === "characterData") {
        translateNode(mutation.target);
      }

      if (mutation.type === "attributes") {
        translateNode(mutation.target);
      }
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributeNames
    });
  }

  console.log("[繁中翻譯] 翻譯引擎已啟動。");
})();
