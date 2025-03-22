import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container, Pallet } from '@/types';

// Standard container types
const standardContainers: Record<string, Container> = {
  '20ft': {
    length: 590,
    width: 235,
    height: 239,
    max_weight: 28000,
    unit: 'cm'
  },
  '40ft': {
    length: 1203,
    width: 235,
    height: 239,
    max_weight: 26500,
    unit: 'cm'
  },
  '40ft-high-cube': {
    length: 1203,
    width: 235,
    height: 270,
    max_weight: 26500,
    unit: 'cm'
  }
};

// Standard pallet types
const standardPallets: Record<string, Pallet> = {
  'euro': {
    length: 120,
    width: 80,
    height: 14.4,
    weight: 25,
    max_weight: 1500,
    unit: 'cm'
  },
  'standard': {
    length: 120,
    width: 100,
    height: 14.4,
    weight: 30,
    max_weight: 1500,
    unit: 'cm'
  },
  'industrial': {
    length: 120,
    width: 120,
    height: 14.4,
    weight: 35,
    max_weight: 2000,
    unit: 'cm'
  }
};

interface ContainerSelectorProps {
  selectedContainer: Container | null;
  selectedPallet: Pallet | null;
  onContainerChange: (container: Container) => void;
  onPalletChange: (pallet: Pallet) => void;
}

export function ContainerSelector({
  selectedContainer,
  selectedPallet,
  onContainerChange,
  onPalletChange
}: ContainerSelectorProps) {
  const [containerType, setContainerType] = useState<string>('20ft');
  const [palletType, setPalletType] = useState<string>('euro');
  const [customContainer, setCustomContainer] = useState<Container>({
    length: 590,
    width: 235,
    height: 239,
    max_weight: 28000,
    unit: 'cm'
  });
  const [customPallet, setCustomPallet] = useState<Pallet>({
    length: 120,
    width: 80,
    height: 14.4,
    weight: 25,
    max_weight: 1500,
    unit: 'cm'
  });
  const [useCustomContainer, setUseCustomContainer] = useState(false);
  const [useCustomPallet, setUseCustomPallet] = useState(false);

  // Handle container type selection
  const handleContainerTypeChange = (value: string) => {
    setContainerType(value);
    if (value !== 'custom') {
      setUseCustomContainer(false);
      onContainerChange(standardContainers[value]);
    } else {
      setUseCustomContainer(true);
      onContainerChange(customContainer);
    }
  };

  // Handle pallet type selection
  const handlePalletTypeChange = (value: string) => {
    setPalletType(value);
    if (value !== 'custom') {
      setUseCustomPallet(false);
      onPalletChange(standardPallets[value]);
    } else {
      setUseCustomPallet(true);
      onPalletChange(customPallet);
    }
  };

  // Handle custom container changes
  const handleCustomContainerChange = (field: keyof Container, value: number) => {
    const updated = { ...customContainer, [field]: value };
    setCustomContainer(updated);
    if (useCustomContainer) {
      onContainerChange(updated);
    }
  };

  // Handle custom pallet changes
  const handleCustomPalletChange = (field: keyof Pallet, value: number) => {
    const updated = { ...customPallet, [field]: value };
    setCustomPallet(updated);
    if (useCustomPallet) {
      onPalletChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Container Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Container Type</label>
          <Select value={containerType} onValueChange={handleContainerTypeChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select container type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20ft">20ft Standard</SelectItem>
              <SelectItem value="40ft">40ft Standard</SelectItem>
              <SelectItem value="40ft-high-cube">40ft High Cube</SelectItem>
              <SelectItem value="custom">Custom Container</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {useCustomContainer && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Custom Container Dimensions</CardTitle>
              <CardDescription>Specify container dimensions in centimeters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Length (cm)</label>
                  <Input
                    type="number"
                    value={customContainer.length}
                    onChange={(e) => handleCustomContainerChange('length', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Width (cm)</label>
                  <Input
                    type="number"
                    value={customContainer.width}
                    onChange={(e) => handleCustomContainerChange('width', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input
                    type="number"
                    value={customContainer.height}
                    onChange={(e) => handleCustomContainerChange('height', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Weight (kg)</label>
                  <Input
                    type="number"
                    value={customContainer.max_weight}
                    onChange={(e) => handleCustomContainerChange('max_weight', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pallet Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Pallet Type</label>
          <Select value={palletType} onValueChange={handlePalletTypeChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select pallet type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="euro">Euro Pallet (120x80)</SelectItem>
              <SelectItem value="standard">Standard Pallet (120x100)</SelectItem>
              <SelectItem value="industrial">Industrial Pallet (120x120)</SelectItem>
              <SelectItem value="custom">Custom Pallet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {useCustomPallet && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Custom Pallet Dimensions</CardTitle>
              <CardDescription>Specify pallet dimensions in centimeters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Length (cm)</label>
                  <Input
                    type="number"
                    value={customPallet.length}
                    onChange={(e) => handleCustomPalletChange('length', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Width (cm)</label>
                  <Input
                    type="number"
                    value={customPallet.width}
                    onChange={(e) => handleCustomPalletChange('width', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input
                    type="number"
                    value={customPallet.height}
                    onChange={(e) => handleCustomPalletChange('height', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input
                    type="number"
                    value={customPallet.weight}
                    onChange={(e) => handleCustomPalletChange('weight', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Weight (kg)</label>
                  <Input
                    type="number"
                    value={customPallet.max_weight}
                    onChange={(e) => handleCustomPalletChange('max_weight', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-sm font-medium">Selected Configuration</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded-md">
            <p className="font-medium">Container</p>
            {selectedContainer && (
              <div className="text-muted-foreground">
                <p>{containerType !== 'custom' ? containerType : 'Custom'}</p>
                <p>{selectedContainer.length} × {selectedContainer.width} × {selectedContainer.height} cm</p>
                <p>Max: {selectedContainer.max_weight} kg</p>
              </div>
            )}
          </div>
          <div className="bg-muted p-2 rounded-md">
            <p className="font-medium">Pallet</p>
            {selectedPallet && (
              <div className="text-muted-foreground">
                <p>{palletType !== 'custom' ? palletType : 'Custom'}</p>
                <p>{selectedPallet.length} × {selectedPallet.width} × {selectedPallet.height} cm</p>
                <p>Weight: {selectedPallet.weight} kg</p>
                <p>Max: {selectedPallet.max_weight} kg</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}