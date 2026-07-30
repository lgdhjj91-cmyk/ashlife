# Badge Studio Reset Design

## Goal

Let customers discard a restored or in-progress Badge Studio project in one safe action instead of deleting designs individually.

## User experience

- Show a compact **Reset all** control beside the draft status only when at least one badge design exists.
- Hide the control while the studio is empty and disable the reset flow while an order upload is running.
- Clicking the control opens an in-page confirmation dialog.
- The dialog explains that photos, badge designs, quantities, arrangement, order details, generated files, and the saved local draft will be removed.
- **No, keep it** closes the dialog without changing any state.
- **Yes, reset all** clears the project and returns to the empty Upload step.
- English and Chinese modes use complete localized copy.

## Data and safety

The reset operation must clear the `current` Badge Studio draft from IndexedDB before clearing the React state. If IndexedDB clearing fails, the current project remains visible and a localized error notice is shown. This avoids an apparently empty screen restoring stale work after a reload.

Before discarding designs, revoke every `blob:` image URL. After a successful clear, reset:

- current step and selected design;
- designs, quantities, and arranged entries;
- sheet selection;
- customer/order details and validation errors;
- notices, order ID, generated export bundle, and submission progress;
- draft status to `new`.

The autosave timer must be cancelled before the IndexedDB clear so an older pending save cannot recreate the deleted draft.

## Interface and accessibility

Use a styled `role="dialog"` with `aria-modal="true"`, a localized accessible name, Escape-to-cancel behavior, and large touch targets. The destructive Yes button is visually distinct; No is the default safe action.

## Error handling

While clearing, disable both dialog actions and show a short progress state. On failure, close the dialog, retain all work, and display the localized reset failure notice.

## Testing

- Unit-test the reset copy in English and Chinese.
- Unit-test that storage is cleared before object URLs are revoked and that a storage failure leaves URLs untouched.
- Browser-test No, Yes, reload persistence, Chinese/English switching, desktop/mobile layout, and console health.
- Run the full tests, lint, and GitHub Pages production build.
