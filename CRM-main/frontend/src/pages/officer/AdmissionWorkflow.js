import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { CheckCircle, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function AdmissionWorkflow() {
  const [admissions, setAdmissions] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [admRes, appRes] = await Promise.all([
        axios.get(`${API}/admissions`, { withCredentials: true }),
        axios.get(`${API}/applicants`, { withCredentials: true })
      ]);
      setAdmissions(admRes.data);
      setApplicants(appRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (applicantId) => {
    try {
      await axios.post(`${API}/admissions/allocate?applicant_id=${applicantId}`, {}, {
        withCredentials: true
      });
      toast({ title: 'Success', description: 'Seat allocated successfully' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to allocate',
        variant: 'destructive'
      });
    }
  };

  const handleConfirm = async (applicantId) => {
    try {
      const response = await axios.post(
        `${API}/admissions/confirm?applicant_id=${applicantId}&fee_amount=150000`,
        {},
        { withCredentials: true }
      );
      toast({
        title: 'Success',
        description: `Admission confirmed! Number: ${response.data.admission_number}`
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to confirm',
        variant: 'destructive'
      });
    }
  };

  const handleMarkFeePaid = async (admissionId) => {
    try {
      await axios.post(`${API}/admissions/${admissionId}/mark-fee-paid`, {}, {
        withCredentials: true
      });
      toast({ title: 'Success', description: 'Fee marked as paid' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update',
        variant: 'destructive'
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const allocatedApplicants = applicants.filter(a => a.status === 'allocated');

  return (
    <div className="space-y-6">
      {/* Pending Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Seat Allocation ({pendingApplicants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplicants.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell><Badge variant="outline">{app.quota_type}</Badge></TableCell>
                  <TableCell>{app.program_id}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleAllocate(app.id)}
                      data-testid={`allocate-btn-${app.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Allocate Seat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Allocated - Pending Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle>Allocated - Pending Confirmation ({allocatedApplicants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocatedApplicants.map((app) => {
                const allVerified = app.documents?.every(d => d.status === 'verified');
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell><Badge variant="outline">{app.quota_type}</Badge></TableCell>
                    <TableCell>
                      {allVerified ? (
                        <Badge className="bg-green-100 text-green-800">All Verified</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(app.id)}
                        disabled={!allVerified}
                        data-testid={`confirm-btn-${app.id}`}
                      >
                        Confirm Admission
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmed Admissions */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Admissions ({admissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission Number</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.map((adm) => (
                <TableRow key={adm.id}>
                  <TableCell className="font-medium">{adm.admission_number}</TableCell>
                  <TableCell><Badge variant="outline">{adm.quota_type}</Badge></TableCell>
                  <TableCell>
                    <Badge className={adm.fee_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {adm.fee_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {adm.fee_status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkFeePaid(adm.id)}
                        data-testid={`mark-fee-paid-${adm.id}`}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Mark Fee Paid
                      </Button>
                    )}
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
