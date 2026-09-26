import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [state, setState] = useState('Delhi');
  const [district, setDistrict] = useState('Central Delhi');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        organization_name: orgName.trim(),
        state,
        district,
        role: 'INSTRUMENT_OWNER'
      });
      navigate('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <div className="max-w-lg w-full space-y-5">
        <div className="text-center space-y-1">
          <div className="h-10 w-10 rounded bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Register Instrument Owner Profile
          </h2>
          <p className="text-xs text-slate-500">
            Create an enterprise profile to register instruments, file verification applications, and manage digital certificates.
          </p>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded shadow-2xs">
          {error && (
            <div className="mb-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business / Establishment Name *
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Apex Logistics Pvt Ltd"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Jurisdiction *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District / Zone *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="owner@company.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating Profile...' : 'Complete Profile Registration'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
