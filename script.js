const fs = require('fs');
const path = 'd:/clinicpro_app/web/src/app/[locale]/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf('// -- Patient Portal Login/Register Sub-Component --');
if (startIndex !== -1) {
  content = content.substring(0, startIndex);
}

const newComponent = \// -- Patient Portal Login/Register Sub-Component --
function PatientPortalForm({
  locale, isRtl, api: axiosApi, router, tc,
}: {
  locale: string;
  isRtl: boolean;
  api: typeof import('@/lib/api').default;
  router: ReturnType<typeof import('next/navigation').useRouter>;
  tc: ReturnType<typeof import('next-intl').useTranslations>;
}) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const normalizePhone = (p: string) => p.replace(/\\s+/g, '');
  const isValidEgyptianPhone = (p: string) => /^(010|011|012|015)\\d{8}$/.test(p);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error(isRtl ? '???? ??? ?????? ?? ??? ??????' : 'Enter phone or patient code');
      return;
    }
    if (!password.trim()) {
      toast.error(isRtl ? '???? ???? ??????' : 'Enter password');
      return;
    }
    
    const cleanId = normalizePhone(identifier);
    if (!cleanId.toUpperCase().startsWith('P-') && !isValidEgyptianPhone(cleanId)) {
      toast.error(isRtl ? '??? ?????? ??? ????' : 'Invalid phone format');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosApi.post('/auth/patient-login', { identifier: cleanId, password });
      localStorage.setItem('access_token', data.access_token);
      window.location.href = \\\/\\\/patient\\\;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('????') || msg.includes('?????') || msg.includes('registered') || msg.includes('found')) {
        toast.error(isRtl ? '?? ???? ???? ???? ???? ????????' : 'No patient found with this data');
      } else if (msg.includes('?????') || msg.includes('Wrong') || msg.includes('Incorrect') || msg.includes('Invalid credentials')) {
        toast.error(isRtl ? '???? ?????? ??? ?????' : 'Incorrect password');
      } else {
        toast.error(isRtl ? '??? ????? ??????' : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error(isRtl ? '?????? ??? ???? ?????? ????????' : 'Please fill all required fields');
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidEgyptianPhone(cleanPhone)) {
      toast.error(isRtl ? '??? ?????? ??? ????' : 'Invalid phone format');
      return;
    }

    if (password.length < 6) {
      toast.error(isRtl ? '???? ?????? ????? ????' : 'Password is too short');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(isRtl ? '????? ???? ?????? ??? ??????' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        fullName: name, 
        phone: cleanPhone, 
        patientCode: patientCode.trim() || undefined, 
        password 
      };
      const { data } = await axiosApi.post('/auth/patient-register', payload);
      localStorage.setItem('access_token', data.access_token);
      window.location.href = \\\/\\\/patient\\\;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('????') || msg.includes('already')) {
        toast.error(isRtl ? '???? ???? ??????? ?? ?????? ??????' : 'You already have an account, please login');
        setMode('login');
      } else if (msg.includes('??? ????') || msg.includes('added by') || msg.includes('not registered') || msg.includes('not found')) {
        toast.error(isRtl ? '?? ???? ??? ???? ???? ?????. ????? ?? ??????? ?????' : 'No patient record found. Contact your clinic first.');
      } else {
        toast.error(isRtl ? '??? ????? ??????' : 'Activation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Patient info box */}
      <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">
        <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed font-medium">
          {mode === 'login' 
            ? (isRtl ? '???? ?????? ???????? ??? ?????? ?? ??? ?????? ?????? ?? ???????.' : 'Login using your phone number or patient code registered at the clinic.')
            : (isRtl ? '?????? ??????? ??? ?? ???? ???? ??? ???? ???? ?????? ???? ???????.' : 'To activate an account, you must already have a patient record at a clinic.')}
        </p>
      </div>

      {/* Login / Register toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('login'); setIdentifier(''); setPassword(''); }}
          className={\lex-1 py-2 text-xs font-bold rounded-lg transition-all \\}
        >
          {isRtl ? '???? ??????' : 'Patient Login'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setPhone(''); setPassword(''); setConfirmPassword(''); setName(''); setPatientCode(''); }}
          className={\lex-1 py-2 text-xs font-bold rounded-lg transition-all \\}
        >
          {isRtl ? '????? ???? ????' : 'Activate New Account'}
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handlePatientLogin} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <Label className="font-semibold">{isRtl ? '??? ?????? ?? ??? ??????' : 'Phone or Patient Code'}</Label>
            <Input
              id="patientLoginIdentifier"
              name="patientLoginIdentifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={isRtl ? '010xxxxxxxx ?? P-0001' : '010xxxxxxxx or P-0001'}
              className="h-12 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-500">{isRtl ? '?????? ??? ?????? ?????? ?? ??????? ?? ??? ?????? ??????? ?? ????.' : 'Use your registered clinic phone or patient code.'}</p>
          </div>
          <div className="space-y-1.5 text-right">
            <Label className="font-semibold">{isRtl ? '???? ??????' : 'Password'}</Label>
            <div className="relative">
              <Input
                id="patientLoginPassword"
                name="patientLoginPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRtl ? '???? ???? ??????' : 'Enter password'}
                className="h-12 pe-10 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={\bsolute top-1/2 -translate-y-1/2 \ text-gray-400 hover:text-gray-600 transition-colors p-1\}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 mt-2 font-bold text-sm bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRtl ? '???? ????? ??????' : 'Login to Patient Portal')}
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePatientRegister} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <Label className="font-semibold">{isRtl ? '????? ??????' : 'Full Name'}</Label>
            <Input
              id="patientRegisterName"
              name="patientRegisterName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRtl ? '????: ???? ????' : 'e.g. Ahmed Mohamed'}
              className="h-12 transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-right">
              <Label className="font-semibold">{isRtl ? '??? ??????' : 'Phone Number'}</Label>
              <Input
                id="patientRegisterPhone"
                name="patientRegisterPhone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="h-12 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="font-semibold">{isRtl ? '??? ?????? (???????)' : 'Patient Code (Optional)'}</Label>
              <Input
                id="patientRegisterCode"
                name="patientRegisterCode"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                placeholder="P-0001"
                className="h-12 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                dir="ltr"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 -mt-1">{isRtl ? '??? ?? ???? ??? ?????? ??????? ???????? ??????? ???? ???????.' : 'Must match your registered clinic data.'}</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-right">
              <Label className="font-semibold">{isRtl ? '???? ??????' : 'Password'}</Label>
              <Input
                id="patientRegisterPassword"
                name="patientRegisterPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRtl ? '???? ???? ??????' : 'Enter password'}
                className="h-12 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="font-semibold">{isRtl ? '????? ???? ??????' : 'Confirm Password'}</Label>
              <Input
                id="patientRegisterConfirm"
                name="patientRegisterConfirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isRtl ? '???? ???? ??????' : 'Enter password'}
                className="h-12 text-left font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex justify-end">
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-teal-600 font-medium">
               {showPassword ? (isRtl ? '????? ???? ??????' : 'Hide password') : (isRtl ? '??? ???? ??????' : 'Show password')}
             </button>
          </div>

          <Button type="submit" className="w-full h-12 mt-2 font-bold text-sm bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRtl ? '????? ???? ??????' : 'Activate Patient Account')}
          </Button>
          
          {/* TODO: SMS/WhatsApp OTP integration for patient activation */}
        </form>
      )}
    </div>
  );
}
\;

fs.writeFileSync(path, content + newComponent);
