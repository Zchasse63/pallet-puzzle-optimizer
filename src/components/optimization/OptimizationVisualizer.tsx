'use client';

import { useEffect, useRef, useState } from 'react';
import { Container, OptimizationResult, Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Try to import Three.js dynamically to avoid SSR issues
let THREE: any;

interface OptimizationVisualizerProps {
  result: OptimizationResult;
  container: Container;
  products: Record<string, Product>;
}

export function OptimizationVisualizer({
  result,
  container,
  products
}: OptimizationVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  
  const [selectedPallet, setSelectedPallet] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [opacity, setOpacity] = useState(0.7);
  
  // Use a random color for each product
  const productColors = useRef<Record<string, string>>({});
  
  // Initialize Three.js on client side only
  useEffect(() => {
    setIsClient(true);
    
    const initThree = async () => {
      // Dynamically import Three.js and OrbitControls
      const threeModule = await import('three');
      THREE = threeModule;
      
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
      
      // Initialize scene if container ref exists
      if (containerRef.current) {
        // Generate random colors for products
        result.palletArrangements[selectedPallet]?.arrangement.forEach(item => {
          if (!productColors.current[item.product_id]) {
            productColors.current[item.product_id] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
          }
        });
        
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        sceneRef.current = scene;
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          10000
        );
        camera.position.set(500, 500, 500);
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Add orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controlsRef.current = controls;
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 500, 300);
        scene.add(directionalLight);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(2000, 20);
        scene.add(gridHelper);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);
        
        // Render the scene
        renderScene();
        
        setIsLoading(false);
      }
    };
    
    initThree();
    
    // Cleanup on unmount
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [isClient]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Update visualization when selected pallet changes
  useEffect(() => {
    if (sceneRef.current && THREE) {
      updateVisualization();
    }
  }, [selectedPallet, opacity, result]);
  
  // Animation loop
  const renderScene = () => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    requestAnimationFrame(renderScene);
  };
  
  // Update the visualization with current data
  const updateVisualization = () => {
    if (!sceneRef.current || !THREE) return;
    
    // Clear previous objects (except lights and helpers)
    while (sceneRef.current.children.length > 4) {
      sceneRef.current.remove(sceneRef.current.children[4]);
    }
    
    if (result.palletArrangements.length === 0) {
      return;
    }
    
    const palletArrangement = result.palletArrangements[selectedPallet];
    if (!palletArrangement) return;
    
    // Add container wireframe
    const containerGeometry = new THREE.BoxGeometry(
      container.length,
      container.height,
      container.width
    );
    const containerEdges = new THREE.EdgesGeometry(containerGeometry);
    const containerLine = new THREE.LineSegments(
      containerEdges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    containerLine.position.set(container.length / 2, container.height / 2, container.width / 2);
    sceneRef.current.add(containerLine);
    
    // Add pallet
    const palletGeometry = new THREE.BoxGeometry(
      palletArrangement.pallet.length,
      palletArrangement.pallet.height,
      palletArrangement.pallet.width
    );
    const palletMaterial = new THREE.MeshLambertMaterial({
      color: 0x8B4513,
      transparent: true,
      opacity: 0.8
    });
    const palletMesh = new THREE.Mesh(palletGeometry, palletMaterial);
    palletMesh.position.set(
      palletArrangement.pallet.length / 2,
      palletArrangement.pallet.height / 2,
      palletArrangement.pallet.width / 2
    );
    sceneRef.current.add(palletMesh);
    
    // Add products
    palletArrangement.arrangement.forEach(item => {
      const product = products[item.product_id];
      if (!product) return;
      
      // Get product dimensions
      const { length, width, height } = product.dimensions;
      
      // Create product mesh
      const productGeometry = new THREE.BoxGeometry(length, height, width);
      const productMaterial = new THREE.MeshLambertMaterial({
        color: productColors.current[item.product_id] || 0xff0000,
        transparent: true,
        opacity: opacity
      });
      const productMesh = new THREE.Mesh(productGeometry, productMaterial);
      
      // Position based on item position and rotation
      const { x, y, z } = item.position;
      const rotation = item.rotation;
      
      // Set position (adjust for center of geometry)
      productMesh.position.set(
        x + length / 2,
        z + height / 2 + palletArrangement.pallet.height, // Add pallet height
        y + width / 2
      );
      
      // Apply rotation if needed
      if (typeof rotation === 'object') {
        productMesh.rotation.set(
          rotation.x * Math.PI / 180,
          rotation.y * Math.PI / 180,
          rotation.z * Math.PI / 180
        );
      }
      
      // Add product outline
      const productEdges = new THREE.EdgesGeometry(productGeometry);
      const productLine = new THREE.LineSegments(
        productEdges,
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );
      productLine.position.copy(productMesh.position);
      productLine.rotation.copy(productMesh.rotation);
      
      // Add to scene
      sceneRef.current.add(productMesh);
      sceneRef.current.add(productLine);
      
      // Add text label for product name (optional)
      // This requires additional setup with TextGeometry or HTML overlay
    });
    
    // Reset camera position if needed
    resetCamera();
  };
  
  // Reset camera to default position
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(500, 500, 500);
      controlsRef.current.target.set(
        container.length / 2,
        container.height / 2,
        container.width / 2
      );
      controlsRef.current.update();
    }
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.2);
      controlsRef.current.update();
    }
  };
  
  if (!isClient) {
    return <div>Loading visualization...</div>;
  }
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pallet-select">Select Pallet</Label>
          <Select
            value={selectedPallet.toString()}
            onValueChange={(value) => setSelectedPallet(parseInt(value))}
            disabled={result.palletArrangements.length === 0}
          >
            <SelectTrigger id="pallet-select">
              <SelectValue placeholder="Select a pallet" />
            </SelectTrigger>
            <SelectContent>
              {result.palletArrangements.map((_, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Pallet #{index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="opacity-slider">Product Transparency</Label>
          <Slider
            id="opacity-slider"
            min={0.1}
            max={1}
            step={0.1}
            value={[opacity]}
            onValueChange={(value) => setOpacity(value[0])}
          />
        </div>
      </div>
      
      {/* Product legend */}
      <div className="flex flex-wrap gap-2 mb-2">
        {result.palletArrangements[selectedPallet]?.arrangement.map(item => {
          const product = products[item.product_id];
          if (!product) return null;
          
          return (
            <Badge
              key={item.product_id}
              variant="outline"
              style={{ 
                backgroundColor: productColors.current[item.product_id] || '#ff0000',
                color: '#ffffff',
                textShadow: '0px 0px 2px #000000'
              }}
            >
              {product.name} ({item.quantity})
            </Badge>
          );
        })}
      </div>
      
      {/* Visualization container */}
      <div className="relative">
        <div 
          ref={containerRef} 
          className="w-full h-[400px] border rounded-md overflow-hidden"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2">Loading 3D visualization...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Camera controls */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={resetCamera}
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Instructions */}
      <Card>
        <CardContent className="p-3 text-sm text-muted-foreground">
          <p><strong>Navigation:</strong> Click and drag to rotate. Scroll to zoom. Right-click and drag to pan.</p>
          <p><strong>Colors:</strong> Each product is shown in a different color. The brown base represents the pallet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
