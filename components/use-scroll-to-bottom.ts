import { useEffect, useRef, type RefObject, useState } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
  boolean,
  () => void,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = () => {
    const container = containerRef.current;
    if (!container) return false;
    
    const threshold = 100; // pixels from bottom
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    setIsAtBottom(isAtBottom);
    return isAtBottom;
  };

  // Manual scroll to bottom function
  const scrollToBottom = () => {
    const end = endRef.current;
    if (end) {
      end.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShouldAutoScroll(true);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Handle scroll events to detect if user is at bottom
      const handleScroll = () => {
        const atBottom = checkIfAtBottom();
        setShouldAutoScroll(atBottom);
      };

      // Handle mutations (new messages, content changes)
      const observer = new MutationObserver((mutations) => {
        // Only auto-scroll if user is at bottom and it's a new message (not content updates)
        const isNewMessage = mutations.some(mutation => 
          mutation.type === 'childList' && 
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node as Element).getAttribute('data-testid')?.includes('message-')
          )
        );
        
        const isContentUpdate = mutations.some(mutation => 
          mutation.type === 'characterData' || 
          (mutation.type === 'childList' && mutation.addedNodes.length > 0 &&
           Array.from(mutation.addedNodes).some(node => 
             node.nodeType === Node.TEXT_NODE || 
             (node.nodeType === Node.ELEMENT_NODE && 
              (node as Element).tagName === 'SPAN' || 
              (node as Element).classList.contains('markdown'))
           ))
        );

        // Only auto-scroll for new messages, not content updates during generation
        if (shouldAutoScroll && isAtBottom && isNewMessage && !isContentUpdate) {
          end.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });

      container.addEventListener('scroll', handleScroll, { passive: true });
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => {
        container.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [shouldAutoScroll, isAtBottom]);

  return [containerRef, endRef, isAtBottom, scrollToBottom];
}
