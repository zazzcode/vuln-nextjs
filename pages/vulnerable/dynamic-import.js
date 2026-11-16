import LabLayout from '../../components/LabLayout';
export default function DynamicImportDemo() {
  return <LabLayout title="DEMO-002 · Dynamic imports"><p>The upstream example imported a missing components directory inside a browser effect. It did not provide a verified arbitrary server-file read or RCE.</p><p>This route is retained as an explanation. A browser bundler constrains dynamic imports to its build context; a controlled query parameter alone does not establish server filesystem access.</p><p>For a working file access scenario, use <a href="/vulnerable/file-read">FS-001</a>.</p></LabLayout>;
}
