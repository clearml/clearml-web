import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  input,
  computed,
  inject,
  DestroyRef // Import DestroyRef
} from '@angular/core';
import { escapeRegex } from '@common/shared/utils/escape-regex';

@Directive({
  selector: '[smSearchText]',
  standalone: true
})
export class SearchTextDirective {
  readonly smSearchText = input<string | undefined | null>(undefined);
  readonly highlightClass = input<string>('font-weight-bold');
  readonly caseSensitive = input<boolean>(false);

  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef); // Inject DestroyRef

  private readonly searchRegex = computed(() => {
    const term = this.smSearchText();
    if (!term || typeof term !== 'string' || term.trim() === '') {
      return null;
    }
    try {
      const flags = this.caseSensitive() ? 'g' : 'gi';
      return new RegExp(escapeRegex(term), flags);
    } catch (e) {
      return null;
    }
  });

  constructor() {

    effect(() => {
      this.searchRegex();
      this.processHighlighting(this.highlightClass());
    });

    this.destroyRef.onDestroy(() => {
      // Ensure highlights are cleared when the directive is destroyed.
      // This is important for virtual scrolling where elements are reused.
      this.clearPreviousHighlights(this.highlightClass()); // Use the current highlight class value
    });
  }

  private processHighlighting(activeHighlightClass: string): void {
    this.clearPreviousHighlights(activeHighlightClass);

    const regex = this.searchRegex();
    if (!regex) {
      return;
    }

    this.walkAndHighlight(this.el.nativeElement, regex, activeHighlightClass);
  }

  private clearPreviousHighlights(className: string): void {
    const hostElement = this.el.nativeElement;
    // Check if hostElement is still valid, e.g., not removed from DOM by other means.
    if (!hostElement || !hostElement.parentNode) {
      return;
    }
    const highlightedSpans = hostElement.querySelectorAll(`span.${className}`);

    highlightedSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
      }
    });
  }

  private walkAndHighlight(node: Node, searchRegex: RegExp, currentHighlightClass: string): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent;
      if (!textContent) {
        return;
      }

      const matches = Array.from(textContent.matchAll(searchRegex));
      if (matches.length > 0) {
        const parent = node.parentNode;
        if (!parent) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach(match => {
          const matchText = match[0];
          const matchIndex = match.index as number;

          if (matchIndex > lastIndex) {
            this.renderer.appendChild(fragment, this.renderer.createText(textContent.substring(lastIndex, matchIndex)));
          }

          const span = this.renderer.createElement('span');
          this.renderer.addClass(span, currentHighlightClass);
          this.renderer.appendChild(span, this.renderer.createText(matchText));
          this.renderer.appendChild(fragment, span);

          lastIndex = matchIndex + matchText.length;
        });

        if (lastIndex < textContent.length) {
          this.renderer.appendChild(fragment, this.renderer.createText(textContent.substring(lastIndex)));
        }
        parent.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.classList.contains(currentHighlightClass) || ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(element.tagName)) {
        return;
      }
      Array.from(node.childNodes).forEach(child => this.walkAndHighlight(child, searchRegex, currentHighlightClass));
    }
  }
}
