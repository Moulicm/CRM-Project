import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function SeatMatrixManager() {
  const [matrices, setMatrices] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    program_id: '',
    academic_year_id: '',
    total_intake: '',
    supernumerary_seats: '0',
    quotas: [
      { quota_name: 'KCET', allocated_seats: '' },
      { quota_name: 'COMEDK', allocated_seats: '' },
      { quota_name: 'Management', allocated_seats: '' }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matRes, progRes, yearRes] = await Promise.all([
        axios.get(`${API}/seats/matrix`, { withCredentials: true }),
        axios.get(`${API}/masters/programs`, { withCredentials: true }),
        axios.get(`${API}/masters/academic-years`, { withCredentials: true })
      ]);
      setMatrices(matRes.data);
      setPrograms(progRes.data);
      setAcademicYears(yearRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quotas sum equals intake
    const totalAllocated = formData.quotas.reduce((sum, q) => sum + parseInt(q.allocated_seats || 0), 0);
    const intake = parseInt(formData.total_intake);
    
    if (totalAllocated !== intake) {
      toast({
        title: 'Validation Error',
        description: `Total quota seats (${totalAllocated}) must equal intake (${intake})`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        total_intake: parseInt(formData.total_intake),
        supernumerary_seats: parseInt(formData.supernumerary_seats),
        quotas: formData.quotas.map(q => ({
          ...q,
          allocated_seats: parseInt(q.allocated_seats),
          filled_seats: 0
        }))
      };

      await axios.post(`${API}/seats/matrix`, payload, { withCredentials: true });
      toast({ title: 'Success', description: 'Seat matrix created successfully' });
      setOpen(false);
      setFormData({
        program_id: '',
        academic_year_id: '',
        total_intake: '',
        supernumerary_seats: '0',
        quotas: [
          { quota_name: 'KCET', allocated_seats: '' },
          { quota_name: 'COMEDK', allocated_seats: '' },
          { quota_name: 'Management', allocated_seats: '' }
        ]
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create seat matrix',
        variant: 'destructive'
      });
    }
  };

  const updateQuotaSeats = (index, value) => {
    const newQuotas = [...formData.quotas];
    newQuotas[index].allocated_seats = value;
    setFormData({ ...formData, quotas: newQuotas });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seat Matrix Configuration</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="add-seat-matrix-button">
              <Plus className="h-4 w-4 mr-1" /> Configure Seat Matrix
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Seat Matrix</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Program</Label>
                  <Select
                    value={formData.program_id}
                    onValueChange={(value) => setFormData({...formData, program_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({...formData, academic_year_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => (
                        <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Intake</Label>
                  <Input
                    type="number"
                    value={formData.total_intake}
                    onChange={(e) => setFormData({...formData, total_intake: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Supernumerary Seats</Label>
                  <Input
                    type="number"
                    value={formData.supernumerary_seats}
                    onChange={(e) => setFormData({...formData, supernumerary_seats: e.target.value})}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <Label className="text-base font-semibold">Quota Configuration</Label>
                <p className="text-sm text-gray-600">Total quota seats must equal total intake</p>
                {formData.quotas.map((quota, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <Label className="w-32">{quota.quota_name}</Label>
                    <Input
                      type="number"
                      value={quota.allocated_seats}
                      onChange={(e) => updateQuotaSeats(idx, e.target.value)}
                      placeholder="Allocated seats"
                      required
                    />
                  </div>
                ))}
                {formData.total_intake && (
                  <div className="text-sm">
                    <span className="text-gray-600">Sum: </span>
                    <span className={`font-semibold ${
                      formData.quotas.reduce((sum, q) => sum + parseInt(q.allocated_seats || 0), 0) === parseInt(formData.total_intake)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formData.quotas.reduce((sum, q) => sum + parseInt(q.allocated_seats || 0), 0)} / {formData.total_intake}
                    </span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Create Seat Matrix</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matrices.map((matrix) => {
            const program = programs.find(p => p.id === matrix.program_id);
            const year = academicYears.find(y => y.id === matrix.academic_year_id);
            
            return (
              <Card key={matrix.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{program?.name || 'Unknown Program'}</h3>
                        <p className="text-sm text-gray-600">{year?.year || 'Unknown Year'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{matrix.total_intake}</p>
                        <p className="text-sm text-gray-600">Total Intake</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {matrix.quotas.map((quota, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600 mb-1">{quota.quota_name}</p>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-bold text-gray-900">{quota.filled_seats}</span>
                            <span className="text-sm text-gray-500">/ {quota.allocated_seats}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(quota.filled_seats / quota.allocated_seats) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {matrix.supernumerary_seats > 0 && (
                      <div className="text-sm text-gray-600">
                        Supernumerary: {matrix.supernumerary_filled} / {matrix.supernumerary_seats}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
