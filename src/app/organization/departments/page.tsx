
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    fetchDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    type Department,
    type AddDepartmentPayload,
    type UpdateDepartmentPayload
} from '@/services/organization-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError } from '@/services/api-client';
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


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");


  const loadDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting to fetch departments from service...");
      const data = await fetchDepartments();
      console.log("Departments fetched:", data);
      setDepartments(data || []); 
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching departments.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Failed to load departments", description: errorMessage });
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAddDepartmentSubmit = async () => {
    if (!newDepartmentName.trim()) {
        toast({ variant: "destructive", title: "Validation Error", description: "Department name cannot be empty." });
        return;
    }
    const payload: AddDepartmentPayload = { name: newDepartmentName.trim() };
    try {
      const newDepartment = await addDepartment(payload);
      setDepartments(prev => [...prev, newDepartment]);
      toast({ title: "Department Added", description: `${newDepartment.name} was successfully added.` });
      setNewDepartmentName("");
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
    setEditingDepartment(dept);
    setEditDepartmentName(dept.name);
    setShowEditDialog(true);
  };

  const handleEditDepartmentSubmit = async () => {
    if (!editingDepartment || !editDepartmentName.trim()) {
        toast({ variant: "destructive", title: "Validation Error", description: "Department name cannot be empty." });
        return;
    }
    const payload: UpdateDepartmentPayload = { name: editDepartmentName.trim() };
    try {
      const updatedDept = await updateDepartment(editingDepartment.id, payload);
      setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));
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
      const errorMessage = err instanceof Error ? err.message : 'Could not delete department.';
      toast({ variant: "destructive", title: "Failed to delete department", description: errorMessage });
      console.error("Delete department failed:", err);
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Manage Departments</CardTitle>
          <CardDescription>View, add, edit, or delete organizational departments.</CardDescription>
        </div>
        <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <AlertDialogTrigger asChild>
                <Button onClick={() => setShowAddDialog(true)} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Department
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Department</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the name for the new department.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="newDepartmentName">Department Name</Label>
                        <Input
                            id="newDepartmentName"
                            placeholder="E.g., Engineering, Marketing"
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNewDepartmentName("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAddDepartmentSubmit}>Add Department</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Employee Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-dept-${index}`}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load departments</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!isLoading && !error && departments.length === 0 && (
             <p className="text-center text-muted-foreground py-8">
                No departments found. Click "Add Department" to create one.
            </p>
        )}
        {!isLoading && !error && departments.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Employee Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                    <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.employeeCount !== undefined ? dept.employeeCount : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
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

      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Department</AlertDialogTitle>
                    <AlertDialogDescription>
                        Update the name for the department: {editingDepartment?.name}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="editDepartmentName">New Department Name</Label>
                        <Input
                            id="editDepartmentName"
                            placeholder="E.g., Advanced Engineering"
                            value={editDepartmentName}
                            onChange={(e) => setEditDepartmentName(e.target.value)}
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setShowEditDialog(false); setEditingDepartment(null); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEditDepartmentSubmit}>Save Changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Card>
  );
}
