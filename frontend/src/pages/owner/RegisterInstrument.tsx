import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstrumentCategory } from '../../types';
import { ArrowLeft, AlertCircle, CheckCircle2, FileText, Upload, Scale, ShieldAlert, Check } from 'lucide-react';

export const RegisterInstrument: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<InstrumentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [newDbId, setNewDbId] = useState<number | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [capacity, setCapacity] = useState('50 kg');
  const [accuracyClass, setAccuracyClass] = useState('Class III (Medium)');
  const [yearOfManufacture, setYearOfManufacture] = useState(2025);
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Delhi');
  const [district, setDistrict] = useState('Central Delhi');
  const [pincode, setPincode] = useState('110001');
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.instruments.getCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(console.error);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(prev => [...prev, e.target.files![0].name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select an instrument category.');
      return;
    }
    if (!declarationAccepted) {
      setError('You must accept the statutory truthfulness declaration before registering.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.instruments.create({
        category_id: Number(categoryId),
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        serial_number: serialNumber.trim(),
        capacity: capacity.trim(),
        accuracy_class: accuracyClass.trim(),
        year_of_manufacture: Number(yearOfManufacture),
        installation_address: address.trim(),
        state,
        district,
        pincode: pincode.trim(),
      });
      setRegisteredId(res.instrument_id);
      setNewDbId(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to register instrument.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredId && newDbId) {
    return (
      <div className="max-w-2xl mx-auto my-6 bg-white p-6 rounded border-2 border-emerald-500 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
              REGISTRATION CONFIRMED
            </span>
            <h2 className="text-base font-bold text-slate-900">Instrument Enrolled in METRION Registry</h2>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
            Permanent Assigned Instrument ID
          </span>
          <p className="font-mono text-2xl font-black text-[#0B2545]">{registeredId}</p>
          <p className="text-xs text-slate-700 mt-1">
            <strong>{manufacturer} {model}</strong> (Serial No: <span className="font-mono">{serialNumber}</span>)
          </p>
          <p className="text-[11px] text-slate-500">
            Location: {address}, {district}, {state} — {pincode}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            to={`/owner/applications/new?instrument_id=${newDbId}&type=NEW_VERIFICATION`}
            className="px-4 py-2 bg-[#0B2545] hover:bg-slate-800 text-white rounded text-xs font-bold shadow-2xs"
          >
            Lodge Verification Application Now →
          </Link>
          <Link
            to={`/owner/instruments/${newDbId}`}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded text-xs font-semibold border border-slate-300"
          >
            View Instrument Profile
          </Link>
          <Link
            to="/owner/instruments"
            className="px-3.5 py-2 text-slate-600 hover:text-slate-900 rounded text-xs font-medium ml-auto"
          >
            Back to Registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-slate-800">
      
      {/* Top Back Link */}
      <div>
        <Link
          to="/owner/instruments"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Equipment Registry
        </Link>
      </div>

      <div className="bg-white rounded border border-slate-300 shadow-2xs overflow-hidden">
        {/* Masthead Header */}
        <div className="bg-[#0B2545] text-white p-5 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold block">
              METRION INSTRUMENT REGISTRY
            </span>
            <h1 className="text-lg font-bold">Register Instrument</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Enter weighing or measuring instrument particulars to enroll it for digital verification.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 self-start sm:self-auto">
            Instrument Registry
          </span>
        </div>

        {error && (
          <div className="m-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          
          {/* SECTION A: Instrument Identification & Maker Particulars */}
          <fieldset className="border border-slate-300 rounded p-4 space-y-3.5">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-900 px-2">
              A. Instrument Identification & Classification
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrument Category <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={e => setCategoryId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white font-medium text-slate-800 focus:border-[#0B2545] focus:outline-hidden"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — Standard Validity: {c.default_validity_months} Months
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer / Make <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avery Weigh-Tronix India"
                  value={manufacturer}
                  onChange={e => setManufacturer(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Designation <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E1010 Platform / ZM305"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number (as engraved on maker's nameplate) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AV-2026-99014"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:border-[#0B2545] focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Serial number will be permanently recorded and cross-verified during physical stamping.
                </span>
              </div>
            </div>
          </fieldset>

          {/* SECTION B: Metrological Technical Parameters */}
          <fieldset className="border border-slate-300 rounded p-4 space-y-3.5">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-900 px-2">
              B. Metrological Technical Specifications
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Capacity (Max) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 kg, 60 Ton, 220 g"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accuracy Classification <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={accuracyClass}
                  onChange={e => setAccuracyClass(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white text-slate-800 focus:border-[#0B2545] focus:outline-hidden"
                >
                  <option value="Class I (Special)">Class I (Special Accuracy)</option>
                  <option value="Class II (High)">Class II (High Accuracy)</option>
                  <option value="Class III (Medium)">Class III (Medium Accuracy)</option>
                  <option value="Class IIII (Ordinary)">Class IIII (Ordinary Accuracy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year of Manufacture <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1990"
                  max="2030"
                  value={yearOfManufacture}
                  onChange={e => setYearOfManufacture(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden font-mono"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION C: Operational Installation Address */}
          <fieldset className="border border-slate-300 rounded p-4 space-y-3.5">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-900 px-2">
              C. Installation / Operational Premises
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premises Physical Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shed 14, APMC Market Yard, Mandi Precinct"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / UT <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District Jurisdiction <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:border-[#0B2545] focus:outline-hidden"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION D: Declaration */}
          <div className="p-3.5 bg-slate-50 border border-slate-300 rounded space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Accuracy & Truthfulness Declaration
            </span>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={e => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[#0B2545] focus:ring-0"
              />
              <span className="leading-relaxed">
                I hereby declare that the particulars furnished above regarding the make, model, capacity, and serial number of the weighing or measuring equipment are accurate, true, and complete. I understand that supplying false information is punishable under Section 48 of the Act.
              </span>
            </label>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/owner/instruments"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#0B2545] hover:bg-slate-800 text-white text-xs font-bold rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Registration...' : 'Register Instrument'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
