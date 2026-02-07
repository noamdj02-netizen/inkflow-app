'use client';

import { useEffect } from 'react';

/**
 * Component to handle DOM reordering of nextjs-portal element
 * Moves the portal to the correct position in the DOM tree (index 13, before target div)
 */
export function PortalOrderHandler() {
  useEffect(() => {
    const reorderPortal = () => {
      // Find the nextjs-portal element (should be a direct child of body)
      const portal = document.querySelector('nextjs-portal');
      if (!portal) return;

      // Ensure portal is a direct child of body
      if (portal.parentElement !== document.body) {
        document.body.appendChild(portal);
      }

      // Find the target div element by checking all divs with matching classes
      // The selector: div.min-h-screen.bg-[#0a0a0a].flex.items-center.justify-center.p-4.relative.overflow-hidden
      const allDivs = document.querySelectorAll('div');
      let targetDiv: Element | null = null;
      
      for (const div of allDivs) {
        const classes = div.className;
        if (
          classes.includes('min-h-screen') &&
          classes.includes('bg-[#0a0a0a]') &&
          classes.includes('flex') &&
          classes.includes('items-center') &&
          classes.includes('justify-center') &&
          classes.includes('p-4') &&
          classes.includes('relative') &&
          classes.includes('overflow-hidden')
        ) {
          targetDiv = div;
          break;
        }
      }
      
      if (!targetDiv || targetDiv.parentElement !== document.body) return;

      const children = Array.from(document.body.children);
      
      // Find the index of the target div
      const targetIndex = children.indexOf(targetDiv);
      const portalIndex = children.indexOf(portal);
      
      // Only reorder if portal exists and is not already in the correct position
      // Portal should be positioned before the target div (at index 13)
      if (targetIndex !== -1 && portalIndex !== -1 && portalIndex !== targetIndex) {
        // Insert portal before the target div
        document.body.insertBefore(portal, targetDiv);
      }
    };

    // Run immediately
    reorderPortal();

    // Use MutationObserver to handle portal creation after initial render
    const observer = new MutationObserver(() => {
      reorderPortal();
    });

    // Observe the document body for changes (direct children only)
    observer.observe(document.body, {
      childList: true,
    });

    // Also use a small delay to catch portal creation
    const timeoutId = setTimeout(() => {
      reorderPortal();
    }, 100);

    // Cleanup
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
