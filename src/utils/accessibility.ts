/**
 * Accessibility utilities for ensuring WCAG 2.1 AA compliance
 */

/**
 * Generates a unique ID for accessibility attributes
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export const generateA11yId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Calculates the contrast ratio between two colors
 * @param foreground - Foreground color in hex format (e.g., "#ffffff")
 * @param background - Background color in hex format (e.g., "#000000")
 * @returns Contrast ratio (WCAG requires 4.5:1 for normal text, 3:1 for large text)
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  // Calculate relative luminance
  const getLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  // Calculate contrast ratio
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return parseFloat(ratio.toFixed(2));
};

/**
 * Checks if the contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Whether the contrast meets WCAG AA standards
 */
export const meetsWcagAA = (ratio: number, isLargeText: boolean = false): boolean => {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Creates aria-live announcement for screen readers
 * @param message - Message to announce
 * @param priority - Announcement priority (polite or assertive)
 */
export const announceToScreenReader = (
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  // Find existing announcement element or create a new one
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.margin = '-1px';
    announcer.style.padding = '0';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }

  // Update the announcer's priority if needed
  if (announcer.getAttribute('aria-live') !== priority) {
    announcer.setAttribute('aria-live', priority);
  }

  // Clear the announcer and then set the new message
  announcer.textContent = '';
  
  // Use setTimeout to ensure the DOM update happens
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 50);
};

/**
 * Keyboard navigation utility for handling arrow key navigation within components
 * @param event - Keyboard event
 * @param elements - Array of focusable elements
 * @param currentIndex - Current focused index
 * @param orientation - Navigation orientation (horizontal or vertical)
 * @returns New index
 */
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number => {
  const isHorizontal = orientation === 'horizontal';
  const keyNext = isHorizontal ? 'ArrowRight' : 'ArrowDown';
  const keyPrev = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
  const keyFirst = 'Home';
  const keyLast = 'End';
  
  let newIndex = currentIndex;
  
  switch (event.key) {
    case keyNext:
      newIndex = (currentIndex + 1) % elements.length;
      break;
    case keyPrev:
      newIndex = (currentIndex - 1 + elements.length) % elements.length;
      break;
    case keyFirst:
      newIndex = 0;
      break;
    case keyLast:
      newIndex = elements.length - 1;
      break;
    default:
      return currentIndex;
  }
  
  // Prevent default behavior for these keys
  event.preventDefault();
  
  // Focus the new element
  elements[newIndex]?.focus();
  
  return newIndex;
};

/**
 * Trap focus within a container for modal dialogs
 * @param containerRef - Reference to the container element
 * @returns Object with trapFocus and releaseFocus functions
 */
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  let previouslyFocusedElement: HTMLElement | null = null;
  
  const trapFocus = () => {
    // Save the currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Find all focusable elements within the container
    const container = containerRef.current;
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    // Focus the first element
    (focusableElements[0] as HTMLElement).focus();
    
    // Set up event listener for tab key
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // If shift + tab and focus is on first element, move to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab and focus is on last element, move to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  };
  
  const releaseFocus = () => {
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };
  
  return { trapFocus, releaseFocus };
};

export default {
  generateA11yId,
  getContrastRatio,
  meetsWcagAA,
  announceToScreenReader,
  handleKeyboardNavigation,
  useFocusTrap
};
