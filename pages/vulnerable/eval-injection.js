import { useEffect, useState } from 'react';
import LabLayout from '../../components/LabLayout';
export default function EvalInjection({ userInput }) {
  const [result, setResult] = useState('');
  useEffect(() => {
    try {
      // JS-001 / CWE-95: intentional browser-side code injection.
      eval(`setResult('${userInput}')`);
    } catch (error) { setResult(error.message); }
  }, [userInput]);
  return <LabLayout title="JS-001 · Browser eval injection"><p>The input query parameter enters eval inside useEffect. This is browser JavaScript execution / XSS; it does not execute in server-side rendering.</p><p>Harmless marker: append <code>{"?input=' + (6 * 7) + '"}</code> to the URL. Expected result: 42.</p><h2>Result</h2><pre>{result}</pre><p>Safe comparison: <a href="/secure/sanitized-input">sanitized input</a>.</p></LabLayout>;
}
export function getServerSideProps({ query }) {
  return { props: { userInput: typeof query.input === 'string' ? query.input : 'Hello lab' } };
}
