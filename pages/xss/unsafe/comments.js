import { useState } from 'react';
import Link from 'next/link';
import LabLayout from '../../../components/LabLayout';
import database from '../../../lib/database.cjs';
const sample = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
export default function CommentsUnsafe({ comments }) {
  const [author, setAuthor] = useState('visitor');
  const [body, setBody] = useState('Hello from the lab');
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try {
      await fetch('/api/xss/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author, body }) });
      window.location.reload();
    } finally { setBusy(false); }
  }
  return <LabLayout title="XSS-004 · Stored XSS in the guestbook (unsafe)">
    <p>A classic guestbook: comments are stored through a parameterized write (see <code>pages/api/xss/comments.js</code> — storage is not the flaw), and this page renders every stored comment as raw HTML. A payload saved once executes for <strong>every future visitor</strong>, which is what separates stored XSS from the reflected variant.</p>
    <form onSubmit={save}>
      <label>Author<input value={author} autoComplete="off" onChange={(e) => setAuthor(e.target.value)} /></label>
      <label>Comment<textarea rows={3} value={body} autoComplete="off" onChange={(e) => setBody(e.target.value)} /></label>
      <div className="actions"><button disabled={busy}>Post comment</button><button type="button" onClick={() => setBody(sample)}>Load XSS sample</button></div>
    </form>
    <h2>All comments</h2>
    {comments.map((comment) => (
      // XSS-004 / CWE-79: stored attacker-controlled strings rendered as raw HTML for every visitor.
      <div key={comment.id} className="xss-output note">
        <strong>{comment.author}</strong> <small>{comment.created_at}</small>
        <div className="comment-body" dangerouslySetInnerHTML={{ __html: comment.body }} />
      </div>
    ))}
    <p>Safe comparison: <Link href="/xss/sanitized/comments">the same comments rendered through DOMPurify</Link> · <Link href="/xss/safe/stored">plain text</Link>.</p>
  </LabLayout>;
}
export async function getServerSideProps() {
  const db = await database.getDatabase();
  const { rows } = await db.query('SELECT id, author, body, created_at FROM comments ORDER BY id');
  return { props: { comments: JSON.parse(JSON.stringify(rows)) } };
}
