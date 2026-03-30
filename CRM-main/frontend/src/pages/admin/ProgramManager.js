import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function ProgramManager() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProgram, setOpenProgram] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const { toast } = useToast();

  const [programForm, setProgramForm] = useState({
    department_id: '',
    name: '',
    code: '',
    course_type: 'UG',
    entry_type: 'Regular'
  });

  const [yearForm, setYearForm] = useState({
    year: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progRes, deptRes, yearRes] = await Promise.all([
        axios.get(`${API}/masters/programs`, { withCredentials: true }),
        axios.get(`${API}/masters/departments`, { withCredentials: true }),
        axios.get(`${API}/masters/academic-years`, { withCredentials: true })
      ]);
      setPrograms(progRes.data);
      setDepartments(deptRes.data);
      setAcademicYears(yearRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/masters/programs`, programForm, { withCredentials: true });
      toast({ title: 'Success', description: 'Program created successfully' });
      setOpenProgram(false);
      setProgramForm({ department_id: '', name: '', code: '', course_type: 'UG', entry_type: 'Regular' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create', variant: 'destructive' });
    }
  };

  const handleCreateAcademicYear = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...yearForm,
        start_date: new Date(yearForm.start_date).toISOString(),
        end_date: new Date(yearForm.end_date).toISOString()
      };
      await axios.post(`${API}/masters/academic-years`, payload, { withCredentials: true });
      toast({ title: 'Success', description: 'Academic year created successfully' });
      setOpenYear(false);
      setYearForm({ year: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create', variant: 'destructive' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Programs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Programs</CardTitle>
          <Dialog open={openProgram} onOpenChange={setOpenProgram}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-program-button">
                <Plus className="h-4 w-4 mr-1" /> Add Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div>
                  <Label>Department</Label>
                  <Select
                    value={programForm.department_id}
                    onValueChange={(value) => setProgramForm({...programForm, department_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={programForm.name}
                    onChange={(e) => setProgramForm({...programForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input
                    value={programForm.code}
                    onChange={(e) => setProgramForm({...programForm, code: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Course Type</Label>
                  <Select
                    value={programForm.course_type}
                    onValueChange={(value) => setProgramForm({...programForm, course_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UG">UG</SelectItem>
                      <SelectItem value="PG">PG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Entry Type</Label>
                  <Select
                    value={programForm.entry_type}
                    onValueChange={(value) => setProgramForm({...programForm, entry_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Lateral">Lateral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create Program</Button>
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
                <TableHead>Course Type</TableHead>
                <TableHead>Entry Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell className="font-medium">{prog.name}</TableCell>
                  <TableCell>{prog.code}</TableCell>
                  <TableCell>{prog.course_type}</TableCell>
                  <TableCell>{prog.entry_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Academic Years */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Academic Years</CardTitle>
          <Dialog open={openYear} onOpenChange={setOpenYear}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-year-button">
                <Plus className="h-4 w-4 mr-1" /> Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Academic Year</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAcademicYear} className="space-y-4">
                <div>
                  <Label>Year (e.g., 2025-2026)</Label>
                  <Input
                    value={yearForm.year}
                    onChange={(e) => setYearForm({...yearForm, year: e.target.value})}
                    placeholder="2025-2026"
                    required
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={yearForm.start_date}
                    onChange={(e) => setYearForm({...yearForm, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={yearForm.end_date}
                    onChange={(e) => setYearForm({...yearForm, end_date: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Academic Year</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>{new Date(year.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(year.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${year.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {year.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
