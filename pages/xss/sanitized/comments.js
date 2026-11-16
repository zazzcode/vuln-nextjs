import { useState } from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import LabLayout from '../../../components/LabLayout';
import database from '../../../lib/database.cjs';
const sample = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
export default function CommentsSanitized({ comments }) {
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
  return <LabLayout title="Safe control · Sanitized guestbook rendering">
    <p>Protected comparison for <Link href="/xss/unsafe/comments">XSS-004</Link>: identical storage, identical list — but every stored body is passed through <a href="https://github.com/cure53/DOMPurify">DOMPurify</a> during server-side rendering before it reaches <code>dangerouslySetInnerHTML</code>. Benign markup (like the seeded <code>&lt;b&gt;</code> tag) survives; event handlers and scripts are stripped. This is the pattern for pages that must render rich text.</p>
    <form onSubmit={save}>
      <label>Author<input value={author} autoComplete="off" onChange={(e) => setAuthor(e.target.value)} /></label>
      <label>Comment<textarea rows={3} value={body} autoComplete="off" onChange={(e) => setBody(e.target.value)} /></label>
      <div className="actions"><button disabled={busy}>Post comment</button><button type="button" onClick={() => setBody(sample)}>Load XSS sample</button><button type="button" onClick={() => setBody('Trying out <b>bold</b> and <i>italic</i>')}>Load benign markup</button></div>
    </form>
    <h2>All comments</h2>
    {comments.map((comment) => (
      <div key={comment.id} className="xss-output note">
        <strong>{comment.author}</strong> <small>{comment.created_at}</small>
        {/* XSS-004 library control: DOMPurify.sanitize() upstream of the raw sink. */}
        <div className="comment-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }} />
      </div>
    ))}
    <p>The seeded <code>&lt;b&gt;benign markup&lt;/b&gt;</code> comment still renders bold; the XSS sample's handler is gone.</p>
  </LabLayout>;
}
export async function getServerSideProps() {
  const db = await database.getDatabase();
  const { rows } = await db.query('SELECT id, author, body, created_at FROM comments ORDER BY id');
  return { props: { comments: JSON.parse(JSON.stringify(rows)) } };
}
