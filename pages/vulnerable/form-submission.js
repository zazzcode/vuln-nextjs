import LabLayout from '../../components/LabLayout';
import ApiConsole from '../../components/ApiConsole';
export default function Scenario() {
  return <LabLayout title="JS-002 \u00b7 Server-side code injection"><p>The API interpolates name and message into eval on the server. Set message to the harmless expression below; the returned message becomes 42.</p><p>Endpoint: <code>/api/vulnerable-submit</code></p><ApiConsole endpoint="/api/vulnerable-submit" initialBody={{"name": "Lab user", "message": "' + (6 * 7) + '"}} /></LabLayout>;
}
