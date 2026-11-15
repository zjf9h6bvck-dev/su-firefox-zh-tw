
(function () {
  "use strict";

  const translations = window.SU_TRANSLATIONS || {};

  if (!translations || Object.keys(translations).length === 0) {
    console.warn("[SU 繁中] 翻譯詞庫尚未載入。");
    return;
  }

  // 不處理程式碼、輸入區及使用者編輯中的內容
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

  function translateText(text) {
    const trimmed = text.trim();

    if (!trimmed) return text;

    // 優先處理完整詞條
    if (Object.prototype.hasOwnProperty.call(
      translations,
      trimmed
    )) {
      return text.replace(trimmed, translations[trimmed]);
    }

    // 再處理文字中的獨立詞組
    let result = text;

    const keys = Object.keys(translations)
      .sort((a, b) => b.length - a.length);

    for (const key of keys) {
      const escaped = key.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const pattern = new RegExp(
        "(^|[^A-Za-z0-9])(" +
        escaped +
        ")(?=$|[^A-Za-z0-9])",
        "g"
      );

      result = result.replace(
        pattern,
        (match, prefix) => prefix + translations[key]
      );
    }

    return result;
  }

  function shouldIgnore(node) {
    let element = node.nodeType === Node.ELEMENT_NODE
      ? node
      : node.parentElement;

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

  function translateNode(node) {
    if (!node || shouldIgnore(node)) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.nodeValue;
      const translated = translateText(original);

      if (translated !== original) {
        node.nodeValue = translated;
      }

      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node;

    // 翻譯常見介面屬性
    for (const name of attributeNames) {
      if (!element.hasAttribute(name)) continue;

      const original = element.getAttribute(name);
      const translated = translateText(original);

      if (translated !== original) {
        element.setAttribute(name, translated);
      }
    }

    // 僅翻譯按鈕類型的 value
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

    // 遍歷子文字節點
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );

    let textNode;

    while ((textNode = walker.nextNode())) {
      if (!shouldIgnore(textNode)) {
        translateNode(textNode);
      }
    }
  }

  // 首次翻譯
  function startTranslation() {
    if (!document.body) return;
    translateNode(document.body);
  }

  startTranslation();

  // 監測網站後續動態載入的內容
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const addedNode of mutation.addedNodes) {
          translateNode(addedNode);
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
      attributeFilter: [
        "placeholder",
        "title",
        "aria-label"
      ]
    });
  }

  console.log("[SU 繁中] 翻譯引擎已啟動。");
})();
