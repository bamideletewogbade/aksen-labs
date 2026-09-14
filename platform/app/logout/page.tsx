export default function Logout() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Sign out of Aksen Workspace</h1>
      <form method="post" action="/api/session?action=logout">
        <button type="submit" style={{ padding: 16 }}>
          Sign out
        </button>
      </form>
    </main>
  );
}
