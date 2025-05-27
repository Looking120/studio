
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For add/edit form
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Briefcase, UserCheck, AlertTriangle } from 'lucide-react'; // UserCheck for assign
import { Skeleton } from '@/components/ui/skeleton';
// import { fetchPositions, addPosition, assignPositionToEmployee /*, updatePosition, deletePosition */ } from '@/services/organization-service';
// import { useToast } from '@/hooks/use-toast';

interface Position {
  id: string;
  title: string;
  departmentId?: string; // Optional: link to a department
  departmentName?: string; // For display
  assignedEmployees?: number;
}

// Mock data until API is connected
const mockPositions: Position[] = [
  { id: 'pos_swe', title: 'Software Engineer', departmentName: 'Engineering', assignedEmployees: 15 },
  { id: 'pos_pm', title: 'Product Manager', departmentName: 'Product', assignedEmployees: 5 },
  { id: 'pos_mkt_spec', title: 'Marketing Specialist', departmentName: 'Marketing', assignedEmployees: 8 },
];

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { toast } = useToast();
  // Add state for managing add/edit/assign dialogs if using them

  useEffect(() => {
    const loadPositions = async () => {
      setIsLoading(true);
      setError(null);
      // try {
      //   // const data = await fetchPositions();
      //   // setPositions(data); // You might need to fetch department names separately or join them in backend
      //   console.log("Placeholder: Would fetch positions.");
      //   await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      //   setPositions(mockPositions);
      // } catch (err) {
      //   console.error("Failed to fetch positions:", err);
      //   setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      //   // toast({ variant: "destructive", title: "Failed to load positions", description: err.message });
      // } finally {
      //   setIsLoading(false);
      // }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setPositions(mockPositions);
      setIsLoading(false);
    };
    loadPositions();
  }, []);

  const handleAddPosition = () => {
    console.log("Placeholder: Open add position form/dialog.");
    // Example:
    // const positionTitle = prompt("Enter new position title:");
    // if (positionTitle) {
    //   try {
    //     // const newPosition = await addPosition({ title: positionTitle, departmentId: "some_dept_id" });
    //     // setPositions(prev => [...prev, newPosition]);
    //     // toast({ title: "Position Added" });
    //     console.log(`Placeholder: Would add position "${positionTitle}"`);
    //   } catch (err) { /* ... handle error ... */ }
    // }
    alert("Add position functionality - placeholder.");
  };

  const handleEditPosition = (pos: Position) => {
    console.log(`Placeholder: Open edit position form for ${pos.title}.`);
    alert(`Edit position ${pos.title} - placeholder.`);
  };

  const handleDeletePosition = (pos: Position) => {
     if (confirm(`Are you sure you want to delete the ${pos.title} position?`)) {
        console.log(`Placeholder: Delete position ${pos.id}.`);
        // try { /* await deletePosition(pos.id); ... */ } catch (err) { /* ... */ }
        alert(`Delete position ${pos.title} - placeholder.`);
     }
  };

  const handleAssignPosition = (pos: Position) => {
    console.log(`Placeholder: Open assign employee to position ${pos.title} dialog.`);
    // Example:
    // const employeeIdToAssign = prompt(`Enter Employee ID to assign to ${pos.title}:`);
    // if (employeeIdToAssign) {
    //   try {
    //     // await assignPositionToEmployee(pos.id, { employeeId: employeeIdToAssign });
    //     // toast({ title: "Position Assigned" });
    //     // Refresh position data or update locally
    //     console.log(`Placeholder: Would assign employee ${employeeIdToAssign} to position ${pos.id}`);
    //   } catch (err) { /* ... handle error ... */ }
    // }
    alert(`Assign employee to ${pos.title} - placeholder.`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Positions</CardTitle>
          <CardDescription>Define and assign job positions within the organization.</CardDescription>
        </div>
        <Button onClick={handleAddPosition} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Position
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load positions</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {!error && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-pos-${index}`}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : positions.length === 0 && !isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No positions found.
                        </TableCell>
                    </TableRow>
                ) : (
                  positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {pos.title}
                      </TableCell>
                      <TableCell>{pos.departmentName || 'N/A'}</TableCell>
                      <TableCell>{pos.assignedEmployees || 0}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="xs" onClick={() => handleAssignPosition(pos)}>
                          <UserCheck className="mr-1 h-3 w-3" /> Assign
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPosition(pos)}>
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeletePosition(pos)}>
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
