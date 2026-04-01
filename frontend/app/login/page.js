import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-10">جاري تحميل صفحة الدخول...</div>}>
      <LoginForm />
    </Suspense>
  );
}
