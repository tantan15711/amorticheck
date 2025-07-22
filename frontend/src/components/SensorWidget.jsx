import React, { useEffect, useRef } from 'react';

const SensorWidget = ({ nombre, config, datos }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar gráfica de historial
    if (datos.historial.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      
      const maxVal = Math.max(config.max, ...datos.historial);
      const minVal = Math.min(config.min, ...datos.historial);
      const range = maxVal - minVal || 1;
      
      // Calcular puntos
      datos.historial.forEach((valor, i) => {
        const x = (i / (datos.historial.length - 1)) * (width - 20) + 10;
        const y = height - 20 - ((valor - minVal) / range) * (height - 40);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Dibujar valor actual como punto
    if (datos.historial.length > 0) {
      const lastValue = datos.historial[datos.historial.length - 1];
      const maxVal = Math.max(config.max, ...datos.historial);
      const minVal = Math.min(config.min, ...datos.historial);
      const range = maxVal - minVal || 1;
      
      const x = width - 10;
      const y = height - 20 - ((lastValue - minVal) / range) * (height - 40);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
    }
  }, [datos, config]);

  return (
    <div className="sensor-widget">
      <div className="sensor-header">
        <span className="sensor-icon">{config.icono}</span>
        <h3>{nombre}</h3>
      </div>
      
      <div className="sensor-value">
        {datos.actual.toFixed(2)} {config.unidad}
      </div>
      
      <div className="sensor-minmax">
        <span>Mín: {datos.min.toFixed(2)}</span>
        <span>Máx: {datos.max.toFixed(2)}</span>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className="sensor-graph"
      />
      
      <div className="sensor-footer">
        <span>Prom: {datos.promedio.toFixed(2)}</span> 
      </div>
    </div>
  );
};

export default SensorWidget;