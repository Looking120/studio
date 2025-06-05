
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Briefcase, UserCheck, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchPositions,
  addPosition,
  assignPositionToEmployee,
  type Position,
  type AddPositionPayload,
  type AssignPositionPayload
} from '@/services/organization-service';
import { fetchUsers, type User } from '@/services/user-service';
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
import {
  Dialog,
  DialogContent,
  DialogDescription as DialogDesc, 
  DialogFooter as DialogFoot, 
  DialogHeader as DialogHead, 
  DialogTitle as DialogTitl, 
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to check for zero GUID or problematic GUID strings
const isZeroGuid = (guid: string | undefined | null): boolean => {
  if (!guid || guid.trim() === "" || guid === "00000000-0000-0000-0000-000000000000") return true;
  return false;
};

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPositionForAssign, setSelectedPositionForAssign] = useState<Position | null>(null);
  const [selectedEmployeeIdToAssign, setSelectedEmployeeIdToAssign] = useState<string>("");
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  const loadPositions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPositions();
      setPositions(data || []);
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
            await signOut();
            router.push('/');
            return;
        }
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching positions.';
        setError(errorMessage);
        toast({ variant: "destructive", title: "Failed to load positions", description: errorMessage });
        setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await fetchUsers();
      console.log("[PositionsPage] Fetched users for assignment dialog:", JSON.stringify(fetchedUsers, null, 2));
      const validUsers = fetchedUsers.filter(u => u && u.id);
      if (validUsers.length !== fetchedUsers.length) {
        console.warn("[PositionsPage] Some fetched users were filtered out due to missing ID or being null/undefined.");
      }
      setUsers(validUsers);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to load users", description: err instanceof Error ? err.message : "Could not fetch users for assignment." });
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadPositions();
    loadUsers();
  }, []);

  const handleAddPositionSubmit = async () => {
    if (!newPositionTitle.trim()) {
        toast({ variant: "destructive", title: "Validation Error", description: "Position title cannot be empty." });
        return;
    }
    const payload: AddPositionPayload = {
        title: newPositionTitle.trim(),
    };
    try {
      const newPosition = await addPosition(payload);
      setPositions(prev => [...prev, newPosition]);
      toast({ title: "Position Added", description: `${newPosition.title} was successfully added.` });
      setNewPositionTitle("");
      setShowAddDialog(false);
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
            await signOut();
            router.push('/');
            return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Could not add position.';
        toast({ variant: "destructive", title: "Failed to add position", description: errorMessage });
        console.error("Add position failed:", err);
    }
  };

  const handleEditPosition = (pos: Position) => {
    console.log(`Placeholder: Open edit position form for ${pos.title}.`);
    alert(`Edit position ${pos.title} - functionality to be implemented with a form/dialog.`);
  };

  const handleDeletePositionConfirm = async (positionId: string) => {
     console.log(`Placeholder: Delete position ${positionId}.`);
     alert(`Delete position ${positionId} - functionality to be implemented.`);
  };

  const openAssignDialog = (position: Position) => {
    setSelectedPositionForAssign(position);
    setSelectedEmployeeIdToAssign("");
    setIsAssignDialogOpen(true);
  };

  const handleAssignPositionSubmit = async () => {
    if (!selectedPositionForAssign || !selectedEmployeeIdToAssign) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a position and an employee." });
      return;
    }

    console.log(
      `[Assign Position] Attempting to assign employee ${selectedEmployeeIdToAssign} to position: `,
      JSON.stringify(selectedPositionForAssign, null, 2) 
    );
    console.log(`[Assign Position] Checking departmentId: "${selectedPositionForAssign.departmentId}" with isZeroGuid: ${isZeroGuid(selectedPositionForAssign.departmentId)}`);


    if (isZeroGuid(selectedPositionForAssign.departmentId)) {
      toast({
        variant: "destructive",
        title: "Assignment Error",
        description: `The selected position "${selectedPositionForAssign.title}" is not associated with a valid department or its department ID is invalid (e.g., '0000-...', null, or empty). Please ensure the position is correctly configured with a department before assigning.`,
        duration: 9000, 
      });
      setIsAssignDialogOpen(false); 
      return;
    }

    setIsSubmittingAssignment(true);
    try {
      const payload: AssignPositionPayload = { employeeId: selectedEmployeeIdToAssign };
      
      await assignPositionToEmployee(selectedPositionForAssign.id, payload);
      toast({ title: "Position Assigned", description: `Successfully assigned position to employee.` });
      setIsAssignDialogOpen(false);
      setSelectedPositionForAssign(null);
      setSelectedEmployeeIdToAssign("");
      loadPositions(); 
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
            await signOut();
            router.push('/');
            setIsSubmittingAssignment(false); 
            return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Could not assign position.';
        toast({ variant: "destructive", title: "Failed to assign position", description: errorMessage });
        console.error("Assign position failed:", err);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Manage Positions</CardTitle>
            <CardDescription>Define and assign job positions within the organization.</CardDescription>
          </div>
          <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <AlertDialogTrigger asChild>
                  <Button onClick={() => setShowAddDialog(true)} disabled={isLoading} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Position
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Add New Position</AlertDialogTitle>
                      <AlertDialogDescription>
                          Enter the title for the new position.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="newPositionTitle">Position Title</Label>
                          <Input
                              id="newPositionTitle"
                              placeholder="E.g., Software Engineer, Marketing Manager"
                              value={newPositionTitle}
                              onChange={(e) => setNewPositionTitle(e.target.value)}
                          />
                      </div>
                  </div>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => { setNewPositionTitle(""); }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAddPositionSubmit}>Add Position</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          {isLoading && (
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
                      {Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={`skeleton-pos-${index}`}>
                          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          )}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="text-xl font-semibold">Failed to load positions</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && positions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                  No positions found. Click "Add Position" to create one.
              </p>
          )}
          {!isLoading && !error && positions.length > 0 && (
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
                  {positions.map((pos) => (
                      <TableRow key={pos.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {pos.title}
                      </TableCell>
                      <TableCell>{pos.departmentName || 'N/A'}</TableCell>
                      <TableCell>{pos.assignedEmployees !== undefined ? pos.assignedEmployees : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-1">
                          <Button variant="outline" size="xs" onClick={() => openAssignDialog(pos)} title="Assign Employee">
                            <UserCheck className="mr-1 h-3 w-3" /> Assign
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPosition(pos)} title="Edit Position">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete Position">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action will permanently delete the "{pos.title}" position. This cannot be undone.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePositionConfirm(pos.id)}>Delete</AlertDialogAction>
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

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHead>
            <DialogTitl>Assign Employee to Position</DialogTitl>
            <DialogDesc>
              Select an employee to assign to the position: "{selectedPositionForAssign?.title}".
            </DialogDesc>
          </DialogHead>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedEmployeeIdToAssign}
                  onValueChange={setSelectedEmployeeIdToAssign}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : users.length > 0 ? (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email} ({user.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>No users available</SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFoot>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSubmittingAssignment}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={handleAssignPositionSubmit}
              disabled={!selectedEmployeeIdToAssign || isSubmittingAssignment || isLoadingUsers}
            >
              {isSubmittingAssignment ? "Assigning..." : "Assign Position"}
            </Button>
          </DialogFoot>
        </DialogContent>
      </Dialog>
    </>
  );
}

    