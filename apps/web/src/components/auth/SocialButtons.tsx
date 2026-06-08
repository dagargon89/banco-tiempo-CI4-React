import { useAuthStore } from '@/stores/authStore';

export default function SocialButtons() {
  const { loginGoogle, loginFacebook, loginMicrosoft, loading } = useAuthStore();

  const btnClass =
    'flex w-full items-center justify-center gap-3 rounded-sm border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-1 transition-colors duration-150 hover:bg-surface-2 disabled:opacity-50';

  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={btnClass} onClick={loginGoogle} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
        Continuar con Google
      </button>

      <button type="button" className={btnClass} onClick={loginFacebook} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M18 9a9 9 0 10-10.406 8.89v-6.29H5.309V9h2.285V7.017c0-2.258 1.344-3.504 3.4-3.504.985 0 2.015.176 2.015.176v2.215h-1.135c-1.118 0-1.467.694-1.467 1.406V9h2.496l-.399 2.6h-2.097v6.29A9.002 9.002 0 0018 9z" fill="#1877F2"/><path d="M12.402 11.6L12.8 9h-2.496V7.31c0-.712.35-1.406 1.467-1.406h1.135V3.69s-1.03-.176-2.015-.176c-2.056 0-3.4 1.246-3.4 3.504V9H5.31v2.6h2.285v6.29a9.07 9.07 0 002.812 0V11.6h2.097z" fill="#fff"/></svg>
        Continuar con Facebook
      </button>

      <button type="button" className={btnClass} onClick={loginMicrosoft} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
        Continuar con Microsoft
      </button>
    </div>
  );
}
