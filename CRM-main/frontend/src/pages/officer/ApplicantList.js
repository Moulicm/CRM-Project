import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function ApplicantList({ onRefresh }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      const response = await axios.get(`${API}/applicants`, { withCredentials: true });
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to load applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'allocated': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Loading applicants...</div>;

  return (
    <Card data-testid="applicant-list">
      <CardHeader>
        <CardTitle>All Applicants ({applicants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell className="font-medium">{applicant.name}</TableCell>
                <TableCell>{applicant.email}</TableCell>
                <TableCell>{applicant.phone}</TableCell>
                <TableCell>
                  <Badge variant="outline">{applicant.quota_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(applicant.status)}>
                    {applicant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedApplicant(applicant)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Applicant Details</DialogTitle>
                      </DialogHeader>
                      {selectedApplicant && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium">{selectedApplicant.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{selectedApplicant.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium">{selectedApplicant.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Gender</p>
                              <p className="font-medium">{selectedApplicant.gender}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Category</p>
                              <p className="font-medium">{selectedApplicant.category}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Quota Type</p>
                              <p className="font-medium">{selectedApplicant.quota_type}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Documents</p>
                            <div className="space-y-2">
                              {selectedApplicant.documents?.map((doc, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{doc.document_name}</span>
                                  <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
