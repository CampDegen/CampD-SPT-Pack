export function bindModDialog(dialog) {
  if (!dialog) return;

  dialog.querySelector(".mod-dialog-close")?.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    for (const button of document.querySelectorAll('.mod-head[aria-expanded="true"]')) {
      button.setAttribute("aria-expanded", "false");
    }
  });
}

export function openModDialog(dialog, html, opener) {
  if (!dialog) return;
  const main = dialog.querySelector(".mod-dialog-main");
  if (main) main.innerHTML = html;
  for (const button of document.querySelectorAll('.mod-head[aria-expanded="true"]')) {
    button.setAttribute("aria-expanded", "false");
  }
  opener?.setAttribute("aria-expanded", "true");
  if (!dialog.open) dialog.showModal();
}
