import { redirect } from 'next/navigation';

export default function LegacyDocumentsPage() {
  redirect('/admin/documents');
}
