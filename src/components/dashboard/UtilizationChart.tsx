import { useEffect, useRef } from 'react';

// This is a placeholder component for a chart
// In a real application, you would use a charting library like Chart.js or Recharts
export function UtilizationChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Set up dimensions
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Sample data - in a real app, this would come from your API
    const data = [65, 70, 68, 74, 78, 76, 79];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    
    // Draw labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    
    // X-axis labels
    const xStep = chartWidth / (labels.length - 1);
    labels.forEach((label, i) => {
      const x = padding + i * xStep;
      ctx.fillText(label, x, height - padding + 20);
    });
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = 60 + i * 10;
      const y = height - padding - (value - 60) / 40 * chartHeight;
      ctx.fillText(`${value}%`, padding - 10, y + 4);
      
      // Draw horizontal grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();
    }
    
    // Draw line chart
    ctx.beginPath();
    data.forEach((value, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (value - 60) / 40 * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points
    data.forEach((value, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (value - 60) / 40 * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw area under the line
    ctx.beginPath();
    data.forEach((value, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (value - 60) / 40 * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding + (data.length - 1) * xStep, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
    
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={300}
      className="w-full h-full"
    />
  );
}