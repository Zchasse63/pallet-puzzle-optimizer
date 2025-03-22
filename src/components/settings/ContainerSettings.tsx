import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Container } from '@/types';

// Mock container templates
const initialContainers: Container[] = [
  {
    length: 590,
    width: 235,
    height: 239,
    max_weight: 28000,
    unit: 'cm'
  },
  {
    length: 1203,
    width: 235,
    height: 239,
    max_weight: 26500,
    unit: 'cm'
  },
  {
    length: 1203,
    width: 235,
    height: 270,
    max_weight: 26500,
    unit: 'cm'
  }
];

export function ContainerSettings() {
  const [containers, setContainers] = useState<Container[]>(initialContainers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New container form state
  const [formData, setFormData] = useState<Container>({
    length: 0,
    width: 0,
    height: 0,
    max_weight: 0,
    unit: 'cm'
  });
  
  // Handle form input changes
  const handleInputChange = (field: keyof Container, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'unit' ? value : parseFloat(value)
    }));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (editingIndex !== null) {
      // Update existing container
      const updatedContainers = [...containers];
      updatedContainers[editingIndex] = formData;
      setContainers(updatedContainers);
    } else {
      // Add new container
      setContainers([...containers, formData]);
    }
    
    // Reset form and close dialog
    setFormData({
      length: 0,
      width: 0,
      height: 0,
      max_weight: 0,
      unit: 'cm'
    });
    setEditingContainer(null);
    setEditingIndex(null);
    setIsDialogOpen(false);
  };
  
  // Handle edit container
  const handleEdit = (container: Container, index: number) => {
    setEditingContainer(container);
    setEditingIndex(index);
    setFormData(container);
    setIsDialogOpen(true);
  };
  
  // Handle delete container
  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this container template?')) {
      const updatedContainers = [...containers];
      updatedContainers.splice(index, 1);
      setContainers(updatedContainers);
    }
  };
  
  // Handle dialog open
  const handleDialogOpen = () => {
    setEditingContainer(null);
    setEditingIndex(null);
    setFormData({
      length: 0,
      width: 0,
      height: 0,
      max_weight: 0,
      unit: 'cm'
    });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleDialogOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Add Container
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {containers.map((container, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Container {index + 1}</CardTitle>
              <CardDescription>
                {container.length} × {container.width} × {container.height} {container.unit}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span>{container.length} {container.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Width:</span>
                  <span>{container.width} {container.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span>{container.height} {container.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Weight:</span>
                  <span>{container.max_weight} kg</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleEdit(container, index)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingContainer ? 'Edit Container' : 'Add Container'}
            </DialogTitle>
            <DialogDescription>
              Enter the dimensions and weight capacity of the container.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_weight">Max Weight (kg)</Label>
                <Input
                  id="max_weight"
                  type="number"
                  value={formData.max_weight}
                  onChange={(e) => handleInputChange('max_weight', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingContainer ? 'Save Changes' : 'Add Container'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}