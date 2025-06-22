
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle, Briefcase, ShieldAlert, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    fetchDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    type Department,
    type AddDepartmentPayload,
    type UpdateDepartmentPayload,
    fetchOffices,
    type Office,
} from '@/services/organization-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentOfficeId, setNewDepartmentOfficeId] = useState("");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [editDepartmentOfficeId, setEditDepartmentOfficeId] = useState("");

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setIsRoleLoading(false);
  }, []);

  const isAdmin = useMemo(() => {
    if (!isClient || isRoleLoading) return false;
    const isSuperAdmin = currentUserEmail === 'joshuandayiadm@gmail.com';
    return isSuperAdmin || (currentUserRole?.toLowerCase().includes('admin') ?? false);
  }, [isClient, isRoleLoading, currentUserRole, currentUserEmail]);


  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting to fetch departments and offices from service...");
      const [deptData, officeData] = await Promise.all([
          fetchDepartments(),
          fetchOffices(1, 100) // Fetch up to 100 offices
      ]);
      console.log("Departments fetched:", deptData);
      console.log("Offices fetched:", officeData);
      setDepartments(deptData || []);
      setOffices(officeData || []);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
        });
        await signOut();
        router.push('/');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching departments or offices.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Failed to load data", description: errorMessage });
      setDepartments([]);
      setOffices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient && !isRoleLoading && isAdmin) {
        loadData();
    } else if (!isAdmin) {
        setIsLoading(false);
    }
  }, [isClient, isRoleLoading, isAdmin]);

  const handleAddDepartmentSubmit = async () => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to add departments." });
      return;
    }
    if (!newDepartmentName.trim() || !newDepartmentOfficeId) {
        toast({ variant: "destructive", title: "Validation Error", description: "Department name and office are required." });
        return;
    }
    const payload: AddDepartmentPayload = { 
        name: newDepartmentName.trim(),
        officeId: newDepartmentOfficeId,
    };
    try {
      const newDepartment = await addDepartment(payload);
      // Re-fetch all data to get updated list with officeName
      await loadData();
      toast({ title: "Department Added", description: `${newDepartment.name} was successfully added.` });
      setNewDepartmentName("");
      setNewDepartmentOfficeId("");
      setShowAddDialog(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Could not add department.';
      toast({ variant: "destructive", title: "Failed to add department", description: errorMessage });
      console.error("Add department failed:", err);
    }
  };

  const openEditDialog = (dept: Department) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to edit departments." });
      return;
    }
    setEditingDepartment(dept);
    setEditDepartmentName(dept.name);
    setEditDepartmentOfficeId(dept.officeId || "");
    setShowEditDialog(true);
  };

  const handleEditDepartmentSubmit = async () => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to edit departments." });
      return;
    }
    if (!editingDepartment || !editDepartmentName.trim() || !editDepartmentOfficeId) {
        toast({ variant: "destructive", title: "Validation Error", description: "Department name and office are required." });
        return;
    }
    const payload: UpdateDepartmentPayload = { 
        name: editDepartmentName.trim(),
        officeId: editDepartmentOfficeId
    };
    try {
      const updatedDept = await updateDepartment(editingDepartment.id, payload);
      // Re-fetch all data to get updated list with officeName
      await loadData();
      toast({ title: "Department Updated", description: `Department "${updatedDept.name}" was successfully updated.` });
      setShowEditDialog(false);
      setEditingDepartment(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Could not update department.';
      toast({ variant: "destructive", title: "Failed to update department", description: errorMessage });
      console.error("Update department failed:", err);
    }
  };


  const handleDeleteDepartmentConfirm = async (departmentId: string) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to delete departments." });
      return;
    }
    try {
      await deleteDepartment(departmentId);
      setDepartments(prev => prev.filter(d => d.id !== departmentId));
      toast({ title: "Department Deleted", description: `Department was successfully deleted.` });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      
      let toastMessage = 'Could not delete department.';
      if (err instanceof HttpError && err.status === 404) {
        toastMessage = `Could not delete: Department not found. It may have already been deleted.`;
        console.warn(`Attempted to delete department ${departmentId}, but it was not found (404).`, err);
      } else if (err instanceof Error) {
        toastMessage = err.message;
        console.error("Delete department failed:", err);
      } else {
        console.error("Delete department failed with an unknown error:", err);
      }
      
      toast({ variant: "destructive", title: "Failed to delete department", description: toastMessage });
    }
  };

  if (isRoleLoading || (!isClient && isLoading)) {
    return (
      <Card className="shadow-lg p-6">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-10 w-1/4 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Manage Departments</CardTitle>
          <CardDescription>View, add, edit, or delete organizational departments.</CardDescription>
        </div>
        {isAdmin && (
            <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <AlertDialogTrigger asChild>
                    <Button onClick={() => setShowAddDialog(true)} disabled={isLoading} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Department
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add New Department</AlertDialogTitle>
                        <AlertDialogDescription>
                            Provide a name and assign an office for the new department.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newDepartmentName">Department Name *</Label>
                            <Input
                                id="newDepartmentName"
                                placeholder="E.g., Engineering, Marketing"
                                value={newDepartmentName}
                                onChange={(e) => setNewDepartmentName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newDepartmentOffice">Office *</Label>
                            <Select onValueChange={setNewDepartmentOfficeId} value={newDepartmentOfficeId}>
                                <SelectTrigger id="newDepartmentOffice">
                                    <SelectValue placeholder="Select an office" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Offices</SelectLabel>
                                        {offices.map(office => (
                                            <SelectItem key={office.id} value={office.id}>
                                                {office.name}
                                            </SelectItem>
                                        ))}
                                        {offices.length === 0 && <SelectItem value="no-offices" disabled>No offices available</SelectItem>}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setNewDepartmentName(""); setNewDepartmentOfficeId(""); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddDepartmentSubmit}>Add Department</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        {!isAdmin && !isRoleLoading && (
             <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShieldAlert className="h-16 w-16 mb-6 text-destructive" />
                <p className="text-2xl font-semibold text-foreground mb-2">Access Denied</p>
                <p className="text-md">You do not have permission to manage departments.</p>
            </div>
        )}
        {isAdmin && isLoading && (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Employee Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-dept-${index}`}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
        {isAdmin && !isLoading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {isAdmin && !isLoading && !error && departments.length === 0 && (
             <p className="text-center text-muted-foreground py-8">
                No departments found. Click "Add Department" to create one.
            </p>
        )}
        {isAdmin && !isLoading && !error && departments.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Employee Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                    <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.officeName ?? 'N/A'}</TableCell>
                    <TableCell>{dept.employeeCount ?? 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(dept)} title="Edit Department">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete Department">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete the "{dept.name}" department. This cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDepartmentConfirm(dept.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isAdmin && (
        <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Department</AlertDialogTitle>
                    <AlertDialogDescription>
                        Update the name and office for the department: {editingDepartment?.name}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="editDepartmentName">Department Name *</Label>
                        <Input
                            id="editDepartmentName"
                            placeholder="E.g., Advanced Engineering"
                            value={editDepartmentName}
                            onChange={(e) => setEditDepartmentName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="editDepartmentOffice">Office *</Label>
                        <Select onValueChange={setEditDepartmentOfficeId} value={editDepartmentOfficeId}>
                            <SelectTrigger id="editDepartmentOffice">
                                <SelectValue placeholder="Select an office" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Offices</SelectLabel>
                                    {offices.map(office => (
                                        <SelectItem key={office.id} value={office.id}>
                                            {office.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setShowEditDialog(false); setEditingDepartment(null); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEditDepartmentSubmit}>Save Changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
