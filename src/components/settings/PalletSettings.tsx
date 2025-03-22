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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Pallet } from '@/types';

// Mock pallet templates
const initialPallets: Pallet[] = [
  {
    length: 120,
    width: 80,
    height: 14.4,
    weight: 25,
    max_weight: 1500,
    unit: 'cm'
  },
  {
    length: 120,
    width: 100,
    height: 14.4,
    weight: 30,
    max_weight: 1500,
    unit: 'cm'
  },
  {
    length: 120,
    width: 120,
    height: 14.4,
    weight: 35,
    max_weight: 2000,
    unit: 'cm'
  }
];

export function PalletSettings() {
  const [pallets, setPallets] = useState<Pallet[]>(initialPallets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPallet, setEditingPallet] = useState<Pallet | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // New pallet form state
  const [formData, setFormData] = useState<Pallet>({
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    max_weight: 0,
    unit: 'cm'
  });
  
  // Handle form input changes
  const handleInputChange = (field: keyof Pallet, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'unit' ? value : parseFloat(value)
    }));
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (editingIndex !== null) {
      // Update existing pallet
      const updatedPallets = [...pallets];
      updatedPallets[editingIndex] = formData;
      setPallets(updatedPallets);
    } else {
      // Add new pallet
      setPallets([...pallets, formData]);
    }
    
    // Reset form and close dialog
    setFormData({
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      max_weight: 0,
      unit: 'cm'
    });
    setEditingPallet(null);
    setEditingIndex(null);
    setIsDialogOpen(false);
  };
  
  // Handle edit pallet
  const handleEdit = (pallet: Pallet, index: number) => {
    setEditingPallet(pallet);
    setEditingIndex(index);
    setFormData(pallet);
    setIsDialogOpen(true);
  };
  
  // Handle delete pallet
  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this pallet template?')) {
      const updatedPallets = [...pallets];
      updatedPallets.splice(index, 1);
      setPallets(updatedPallets);
    }
  };
  
  // Handle dialog open
  const handleDialogOpen = () => {
    setEditingPallet(null);
    setEditingIndex(null);
    setFormData({
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
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
          Add Pallet
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pallets.map((pallet, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Pallet {index + 1}</CardTitle>
              <CardDescription>
                {pallet.length} × {pallet.width} × {pallet.height} {pallet.unit}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span>{pallet.length} {pallet.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Width:</span>
                  <span>{pallet.width} {pallet.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span>{pallet.height} {pallet.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>{pallet.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Weight:</span>
                  <span>{pallet.max_weight} kg</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleEdit(pallet, index)}>
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
              {editingPallet ? 'Edit Pallet' : 'Add Pallet'}
            </DialogTitle>
            <DialogDescription>
              Enter the dimensions and weight specifications of the pallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"type="number"
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
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPallet ? 'Save Changes' : 'Add Pallet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}