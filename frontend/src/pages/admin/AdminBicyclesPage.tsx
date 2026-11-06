import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Plus, 
  QrCode, 
  Edit3, 
  Search, 
  MapPin, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import { Bicycle, BicycleStatus } from '../../types';

export const AdminBicyclesPage: React.FC = () => {
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalBike, setEditModalBike] = useState<Bicycle | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    bicycleCode: string;
    qrToken: string;
    qrDataUrl: string;
    qrSvg: string;
    qrPayload: string;
  } | null>(null);

  // New bike form
  const [newBike, setNewBike] = useState({
    bicycleCode: '',
    model: 'Campus Cruiser Pro V2',
    location: 'Main Gate Station',
    status: 'AVAILABLE' as BicycleStatus
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBicycles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/bicycles?${params.toString()}`);
      setBicycles(res.data.bicycles || []);
    } catch (err) {
      console.error('Error fetching bicycles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBicycles();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBicycles();
  };

  const handleCreateBike = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.post('/admin/bicycles', newBike);
      if (res.data.success) {
        setAddModalOpen(false);
        setNewBike({
          bicycleCode: '',
          model: 'Campus Cruiser Pro V2',
          location: 'Main Gate Station',
          status: 'AVAILABLE'
        });
        fetchBicycles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bicycle');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBike) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch(`/admin/bicycles/${editModalBike.id}`, {
        model: editModalBike.model,
        location: editModalBike.location,
        status: editModalBike.status
      });
      if (res.data.success) {
        setEditModalBike(null);
        fetchBicycles();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bicycle');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQr = async (bikeId: string) => {
    try {
      const res = await api.get(`/admin/bicycles/${bikeId}/qr`);
      if (res.data.success) {
        setQrModalData(res.data);
      }
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const downloadQr = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSvg = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fleet & QR Code Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage bicycles, generate unique QR tags, and track fleet availability</p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-campus-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bicycle</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, model, station..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['', 'AVAILABLE', 'RENTED', 'MAINTENANCE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-campus-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status || 'All Bicycles'}
            </button>
          ))}
        </div>
      </div>

      {/* Bicycle Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-600 mx-auto mb-2"></div>
            Loading fleet records...
          </div>
        ) : bicycles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Bicycle Code</th>
                  <th className="px-5 py-3.5">Model</th>
                  <th className="px-5 py-3.5">Station / Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Total Rides</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bicycles.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-extrabold text-slate-900">
                      {b.bicycleCode}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {b.model}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.status === 'AVAILABLE'
                          ? 'bg-campus-50 text-campus-700 border border-campus-200'
                          : b.status === 'RENTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : b.status === 'MAINTENANCE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {b._count?.rentals || 0} rides
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenQr(b.id)}
                        className="p-1.5 bg-slate-100 hover:bg-campus-50 hover:text-campus-700 rounded-lg text-slate-600 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="View & Download QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">QR Code</span>
                      </button>
                      <button
                        onClick={() => setEditModalBike(b)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Edit Bicycle Info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">
            No bicycles match your filter.
          </div>
        )}
      </div>

      {/* Add Bicycle Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Add Bicycle to Campus Fleet</h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBike} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Bicycle Code (Leave blank for auto-generation)
                </label>
                <input
                  type="text"
                  value={newBike.bicycleCode}
                  onChange={(e) => setNewBike({ ...newBike, bicycleCode: e.target.value })}
                  placeholder="e.g. CYC-009"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-campus-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Bicycle Model
                </label>
                <input
                  type="text"
                  required
                  value={newBike.model}
                  onChange={(e) => setNewBike({ ...newBike, model: e.target.value })}
                  placeholder="Campus Cruiser Pro V2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Station / Stand Location
                </label>
                <input
                  type="text"
                  required
                  value={newBike.location}
                  onChange={(e) => setNewBike({ ...newBike, location: e.target.value })}
                  placeholder="Main Gate Station"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Initial Status
                </label>
                <select
                  value={newBike.status}
                  onChange={(e) => setNewBike({ ...newBike, status: e.target.value as BicycleStatus })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500 bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold shadow-md shadow-campus-600/20 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Register Bicycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bicycle Modal */}
      {editModalBike && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit {editModalBike.bicycleCode}
              </h3>
              <button onClick={() => setEditModalBike(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBike} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Bicycle Model
                </label>
                <input
                  type="text"
                  required
                  value={editModalBike.model}
                  onChange={(e) => setEditModalBike({ ...editModalBike, model: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Station Location
                </label>
                <input
                  type="text"
                  required
                  value={editModalBike.location}
                  onChange={(e) => setEditModalBike({ ...editModalBike, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={editModalBike.status}
                  onChange={(e) => setEditModalBike({ ...editModalBike, status: e.target.value as BicycleStatus })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-campus-500 bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RENTED">RENTED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalBike(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white font-bold shadow-md shadow-campus-600/20 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Tag & Download Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Printable Bicycle Tag</span>
              <button onClick={() => setQrModalData(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Badge Preview */}
            <div className="p-5 bg-slate-50 border-2 border-dashed border-campus-400 rounded-2xl space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-widest text-campus-700">
                CycleLoop Campus Fleet
              </div>
              <img
                src={qrModalData.qrDataUrl}
                alt={`QR Code for ${qrModalData.bicycleCode}`}
                className="w-48 h-48 mx-auto rounded-xl shadow-xs bg-white p-2 border border-slate-200"
              />
              <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-wider">
                {qrModalData.bicycleCode}
              </div>
              <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto truncate">
                Token: {qrModalData.qrToken}
              </p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => downloadQr(qrModalData.qrDataUrl, `${qrModalData.bicycleCode}-qr.png`)}
                className="py-2.5 px-3 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold shadow-md shadow-campus-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSvg(qrModalData.qrSvg, `${qrModalData.bicycleCode}-qr.svg`)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
