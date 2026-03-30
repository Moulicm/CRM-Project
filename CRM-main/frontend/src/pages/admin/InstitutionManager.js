import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Building2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function InstitutionManager() {
  const [institutions, setInstitutions] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState('institution');
  const { toast } = useToast();

  const [institutionForm, setInstitutionForm] = useState({ name: '', code: '', address: '' });
  const [campusForm, setCampusForm] = useState({ institution_id: '', name: '', code: '', location: '' });
  const [departmentForm, setDepartmentForm] = useState({ campus_id: '', name: '', code: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [instRes, campRes, deptRes] = await Promise.all([
        axios.get(`${API}/masters/institutions`, { withCredentials: true }),
        axios.get(`${API}/masters/campuses`, { withCredentials: true }),
        axios.get(`${API}/masters/departments`, { withCredentials: true })
      ]);
      setInstitutions(instRes.data);
      setCampuses(campRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/masters/institutions`, institutionForm, { withCredentials: true });
      toast({ title: 'Success', description: 'Institution created successfully' });
      setOpen(false);
      setInstitutionForm({ name: '', code: '', address: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create', variant: 'destructive' });
    }
  };

  const handleCreateCampus = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/masters/campuses`, campusForm, { withCredentials: true });
      toast({ title: 'Success', description: 'Campus created successfully' });
      setOpen(false);
      setCampusForm({ institution_id: '', name: '', code: '', location: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create', variant: 'destructive' });
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/masters/departments`, departmentForm, { withCredentials: true });
      toast({ title: 'Success', description: 'Department created successfully' });
      setOpen(false);
      setDepartmentForm({ campus_id: '', name: '', code: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create', variant: 'destructive' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Institutions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Institutions</span>
          </CardTitle>
          <Dialog open={open && formType === 'institution'} onOpenChange={(o) => { setOpen(o); setFormType('institution'); }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-institution-button">
                <Plus className="h-4 w-4 mr-1" /> Add Institution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Institution</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateInstitution} className="space-y-4">
                <div>
                  <Label>Institution Name</Label>
                  <Input value={institutionForm.name} onChange={(e) => setInstitutionForm({...institutionForm, name: e.target.value})} required />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={institutionForm.code} onChange={(e) => setInstitutionForm({...institutionForm, code: e.target.value})} required />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={institutionForm.address} onChange={(e) => setInstitutionForm({...institutionForm, address: e.target.value})} />
                </div>
                <Button type="submit" className="w-full">Create Institution</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.name}</TableCell>
                  <TableCell>{inst.code}</TableCell>
                  <TableCell>{inst.address || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campuses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campuses</CardTitle>
          <Dialog open={open && formType === 'campus'} onOpenChange={(o) => { setOpen(o); setFormType('campus'); }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-campus-button">
                <Plus className="h-4 w-4 mr-1" /> Add Campus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campus</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCampus} className="space-y-4">
                <div>
                  <Label>Institution</Label>
                  <select 
                    className="w-full border rounded p-2"
                    value={campusForm.institution_id}
                    onChange={(e) => setCampusForm({...campusForm, institution_id: e.target.value})}
                    required
                  >
                    <option value="">Select Institution</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Campus Name</Label>
                  <Input value={campusForm.name} onChange={(e) => setCampusForm({...campusForm, name: e.target.value})} required />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={campusForm.code} onChange={(e) => setCampusForm({...campusForm, code: e.target.value})} required />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={campusForm.location} onChange={(e) => setCampusForm({...campusForm, location: e.target.value})} />
                </div>
                <Button type="submit" className="w-full">Create Campus</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell className="font-medium">{campus.name}</TableCell>
                  <TableCell>{campus.code}</TableCell>
                  <TableCell>{campus.location || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Departments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Departments</CardTitle>
          <Dialog open={open && formType === 'department'} onOpenChange={(o) => { setOpen(o); setFormType('department'); }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-department-button">
                <Plus className="h-4 w-4 mr-1" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <Label>Campus</Label>
                  <select 
                    className="w-full border rounded p-2"
                    value={departmentForm.campus_id}
                    onChange={(e) => setDepartmentForm({...departmentForm, campus_id: e.target.value})}
                    required
                  >
                    <option value="">Select Campus</option>
                    {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Department Name</Label>
                  <Input value={departmentForm.name} onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})} required />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={departmentForm.code} onChange={(e) => setDepartmentForm({...departmentForm, code: e.target.value})} required />
                </div>
                <Button type="submit" className="w-full">Create Department</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
