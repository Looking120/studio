
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For add/edit form
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDepartments, addDepartment, type Department, type AddDepartmentPayload } from '@/services/organization-service';
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


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // TODO: Add state for managing add/edit dialog if using one
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");


  const loadDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: "destructive", title: "Failed to load departments", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [toast, router]);

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
        toast({ variant: "destructive", title: "Validation Error", description: "Department name cannot be empty." });
        return;
    }
    const payload: AddDepartmentPayload = { name: newDepartmentName.trim() };
    try {
      const newDepartment = await addDepartment(payload);
      setDepartments(prev => [...prev, newDepartment]); // Or await loadDepartments();
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
  
  const handleEditDepartment = (dept: Department) => {
    console.log(`Placeholder: Open edit department form for ${dept.name}.`);
    alert(`Edit department ${dept.name} - functionality to be implemented.`);
    // Example: You would typically open a dialog pre-filled with dept.name
    // and then call an updateDepartment service function.
  };

  const handleDeleteDepartment = (dept: Department) => {
    // Placeholder: Implement actual delete call to organization-service
    // try {
    //   await deleteDepartment(dept.id); // Assuming deleteDepartment exists in service
    //   setDepartments(prev => prev.filter(d => d.id !== dept.id)); // Or await loadDepartments();
    //   toast({ title: "Department Deleted" });
    // } catch (err) { /* ... error handling ... */ }
    console.log(`Placeholder: Delete department ${dept.id}.`);
    alert(`Delete department ${dept.name} - functionality to be implemented.`);
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
                    <Input 
                        id="departmentName"
                        placeholder="E.g., Engineering, Marketing"
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        className="col-span-3"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNewDepartmentName("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAddDepartment}>Add Department</AlertDialogAction>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditDepartment(dept)} title="Edit Department">
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
                                <AlertDialogAction onClick={() => handleDeleteDepartment(dept)}>Delete</AlertDialogAction>
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
    </Card>
  );
}
