// Shown inside the workspace shell while a page's own data is still on its way
// from Neon. Without it the server held the whole response until the slowest
// query finished, so the old page sat on screen for seconds after a click.
export default function AdminLoading() {
  return (
    <section className="admin-main admin-loading" aria-busy="true">
      <output className="sr-only">Loading page</output>
      <div className="admin-loading-head" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="admin-loading-body" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
