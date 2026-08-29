export const installExternalOverlayGuard = ({ body, Observer }) => {
  const hiddenPanels = new Map();

  const hideExternalPanels = () => {
    [...body.children]
      .filter((element) => element.tagName === 'DIV' && element.id !== 'root')
      .forEach((panel) => {
        if (!hiddenPanels.has(panel)) {
          hiddenPanels.set(panel, {
            display: panel.style.getPropertyValue('display'),
            priority: panel.style.getPropertyPriority('display'),
          });
        }
        if (panel.style.getPropertyValue('display') !== 'none' || panel.style.getPropertyPriority('display') !== 'important') {
          panel.style.setProperty('display', 'none', 'important');
        }
      });
  };

  body.classList.add('merge-joy-active');
  hideExternalPanels();
  const observer = new Observer(hideExternalPanels);
  observer.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  return () => {
    observer.disconnect();
    hiddenPanels.forEach(({ display, priority }, panel) => {
      if (display) panel.style.setProperty('display', display, priority);
      else panel.style.removeProperty('display');
    });
    body.classList.remove('merge-joy-active');
  };
};
