import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { formatApiErrorDetail } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function CreateApplicant({ onSuccess }) {
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    category: 'GM',
    program_id: '',
    academic_year_id: '',
    quota_type: 'KCET',
    entry_type: 'Regular',
    allotment_number: '',
    marks: '',
    qualifying_exam: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [progRes, yearRes] = await Promise.all([
        axios.get(`${API}/masters/programs`, { withCredentials: true }),
        axios.get(`${API}/masters/academic-years`, { withCredentials: true })
      ]);
      setPrograms(progRes.data);
      setAcademicYears(yearRes.data);
      if (yearRes.data.length > 0) {
        setFormData(prev => ({ ...prev, academic_year_id: yearRes.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).toISOString(),
        marks: formData.marks ? parseFloat(formData.marks) : null
      };
      
      await axios.post(`${API}/applicants`, payload, { withCredentials: true });
      toast({ title: 'Success', description: 'Applicant created successfully' });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'Male',
        category: 'GM',
        program_id: '',
        academic_year_id: academicYears[0]?.id || '',
        quota_type: 'KCET',
        entry_type: 'Regular',
        allotment_number: '',
        marks: '',
        qualifying_exam: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: formatApiErrorDetail(error.response?.data?.detail) || 'Failed to create applicant',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="create-applicant-form">
      <CardHeader>
        <CardTitle>Create New Applicant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                data-testid="applicant-name-input"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                data-testid="applicant-email-input"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                data-testid="applicant-phone-input"
              />
            </div>
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GM">GM (General Merit)</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="OBC">OBC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Program *</Label>
              <Select value={formData.program_id} onValueChange={(value) => setFormData({...formData, program_id: value})}>
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
              <Label>Quota Type *</Label>
              <Select value={formData.quota_type} onValueChange={(value) => setFormData({...formData, quota_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KCET">KCET</SelectItem>
                  <SelectItem value="COMEDK">COMEDK</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Allotment Number</Label>
              <Input
                value={formData.allotment_number}
                onChange={(e) => setFormData({...formData, allotment_number: e.target.value})}
                placeholder="e.g., KCET2025001234"
              />
            </div>
            <div>
              <Label>Marks</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.marks}
                onChange={(e) => setFormData({...formData, marks: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Qualifying Exam</Label>
              <Input
                value={formData.qualifying_exam}
                onChange={(e) => setFormData({...formData, qualifying_exam: e.target.value})}
                placeholder="e.g., Karnataka CET"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" data-testid="create-applicant-submit">
            {loading ? 'Creating...' : 'Create Applicant'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
