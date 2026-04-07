import { redirect } from 'next/navigation';

// Redirect root "/" to the default locale path handled by [locale] layout
export default function RootPage() {
  redirect('/en');
}
