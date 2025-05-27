
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For add/edit form
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import { fetchDepartments, addDepartment /*, updateDepartment, deleteDepartment */ } from '@/services/organization-service';
// import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  // Add other relevant fields like headOfDepartment, employeeCount etc.
  employeeCount?: number; 
}

// Mock data until API is connected
const mockDepartments: Department[] = [
  { id: 'dept_eng', name: 'Engineering', employeeCount: 50 },
  { id: 'dept_mkt', name: 'Marketing', employeeCount: 25 },
  { id: 'dept_hr', name: 'Human Resources', employeeCount: 10 },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { toast } = useToast();
  // Add state for managing add/edit dialog if using one

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoading(true);
      setError(null);
      // try {
      //   // const data = await fetchDepartments();
      //   // setDepartments(data);
      //   console.log("Placeholder: Would fetch departments.");
      //   await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      //   setDepartments(mockDepartments);
      // } catch (err) {
      //   console.error("Failed to fetch departments:", err);
      //   setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      //   // toast({ variant: "destructive", title: "Failed to load departments", description: err.message });
      // } finally {
      //   setIsLoading(false);
      // }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setDepartments(mockDepartments);
      setIsLoading(false);
    };
    loadDepartments();
  }, []);

  const handleAddDepartment = () => {
    console.log("Placeholder: Open add department form/dialog.");
    // Example:
    // const departmentName = prompt("Enter new department name:");
    // if (departmentName) {
    //   try {
    //     // const newDepartment = await addDepartment({ name: departmentName });
    //     // setDepartments(prev => [...prev, newDepartment]);
    //     // toast({ title: "Department Added" });
    //     console.log(`Placeholder: Would add department "${departmentName}"`);
    //   } catch (err) { /* ... handle error ... */ }
    // }
    alert("Add department functionality - placeholder.");
  };
  
  const handleEditDepartment = (dept: Department) => {
    console.log(`Placeholder: Open edit department form for ${dept.name}.`);
    alert(`Edit department ${dept.name} - placeholder.`);
  };

  const handleDeleteDepartment = (dept: Department) => {
    if (confirm(`Are you sure you want to delete the ${dept.name} department?`)) {
      console.log(`Placeholder: Delete department ${dept.id}.`);
      // try {
      //   // await deleteDepartment(dept.id);
      //   // setDepartments(prev => prev.filter(d => d.id !== dept.id));
      //   // toast({ title: "Department Deleted" });
      // } catch (err) { /* ... handle error ... */ }
      alert(`Delete department ${dept.name} - placeholder.`);
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Departments</CardTitle>
          <CardDescription>View, add, edit, or delete organizational departments.</CardDescription>
        </div>
        <Button onClick={handleAddDepartment} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load departments</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!error && (
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
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-dept-${index}`}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : departments.length === 0 && !isLoading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No departments found.
                        </TableCell>
                    </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.employeeCount || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditDepartment(dept)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDepartment(dept)}>
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
